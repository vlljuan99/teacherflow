import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { Role } from "@/lib/enums";
import { audit } from "@/server/audit/log";
import { z } from "zod";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      locale: string;
      studentId?: string | null;
      guardianId?: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
    locale?: string;
    studentId?: string | null;
    guardianId?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    locale: string;
    studentId?: string | null;
    guardianId?: string | null;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Provision a User from a Google email by matching an existing User,
// Student.email or Guardian.email. Returns null if no match (login is rejected).
async function provisionFromEmail(
  email: string,
  name: string | null | undefined,
) {
  const normalized = email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalized },
    include: {
      student: { select: { id: true } },
      guardian: { select: { id: true } },
    },
  });
  if (existing) return existing.isActive ? existing : null;

  // Match a pre-registered Student by email
  const student = await prisma.student.findFirst({
    where: { email: { equals: normalized } },
  });
  if (student) {
    const created = await prisma.user.create({
      data: {
        email: normalized,
        name: name || `${student.firstName} ${student.lastName}`,
        role: Role.STUDENT,
        passwordHash: null,
        locale: "es",
        student: { connect: { id: student.id } },
      },
      include: {
        student: { select: { id: true } },
        guardian: { select: { id: true } },
      },
    });
    return created;
  }

  const guardian = await prisma.guardian.findFirst({
    where: { email: { equals: normalized } },
  });
  if (guardian) {
    const created = await prisma.user.create({
      data: {
        email: normalized,
        name: name || `${guardian.firstName} ${guardian.lastName}`,
        role: Role.GUARDIAN,
        passwordHash: null,
        locale: "es",
        guardian: { connect: { id: guardian.id } },
      },
      include: {
        student: { select: { id: true } },
        guardian: { select: { id: true } },
      },
    });
    return created;
  }

  return null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Sign-in only requests basic scopes. Calendar/Meet access is handled
      // by a separate consent flow (see /api/google/calendar/start).
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const parsed = credentialsSchema.safeParse(creds);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            student: { select: { id: true } },
            guardian: { select: { id: true } },
          },
        });
        if (!user || !user.isActive || !user.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
          locale: user.locale,
          studentId: user.student?.id ?? null,
          guardianId: user.guardian?.id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;
        const provisioned = await provisionFromEmail(email, user.name);
        if (!provisioned) return "/login?error=not_registered";
        if (user.image) {
          // Backfill the photo from Google when missing (students and staff).
          await prisma.student.updateMany({
            where: { email: { equals: email.toLowerCase() }, photoUrl: null },
            data: { photoUrl: user.image },
          });
          if (!provisioned.photoUrl) {
            await prisma.user.update({
              where: { id: provisioned.id },
              data: { photoUrl: user.image },
            });
          }
        }
        // Record the sign-in so it surfaces in the teacher's recent activity.
        await audit({
          actorUserId: provisioned.id,
          action: "login.success",
          entity: "User",
          entityId: provisioned.id,
        });
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Credentials path: `user` carries the role we set in authorize
      if (user?.role) {
        token.id = user.id as string;
        token.role = user.role;
        token.locale = user.locale ?? "es";
        token.studentId = user.studentId ?? null;
        token.guardianId = user.guardianId ?? null;
        return token;
      }
      // Google path: enrich from DB using the email
      if (account?.provider === "google" && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          include: {
            student: { select: { id: true } },
            guardian: { select: { id: true } },
          },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role as Role;
          token.locale = dbUser.locale;
          token.studentId = dbUser.student?.id ?? null;
          token.guardianId = dbUser.guardian?.id ?? null;
        }
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.locale = token.locale as string;
      session.user.studentId = (token.studentId as string | null) ?? null;
      session.user.guardianId = (token.guardianId as string | null) ?? null;
      return session;
    },
  },
});
