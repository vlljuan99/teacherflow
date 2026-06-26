import { auth, signIn } from "@/server/auth/config";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@/lib/enums";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { OdysseyMark } from "@/components/brand/odyssey-logo";
import { audit } from "@/server/audit/log";

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch {
    await audit({ action: "login.failed", entity: "User", payload: { email } });
    redirect(`/login?error=1`);
  }
  const session = await auth();
  await audit({
    actorUserId: session?.user?.id,
    action: "login.success",
    entity: "User",
    entityId: session?.user?.id,
  });
  if (
    session?.user?.role === Role.TEACHER ||
    session?.user?.role === Role.ADMIN
  )
    redirect("/dashboard");
  redirect("/portal/dashboard");
}

async function googleLoginAction() {
  "use server";
  await signIn("google", { redirectTo: "/" });
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");
  const { error } = await searchParams;
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const notRegistered = error === "not_registered";

  const session = await auth();
  if (session?.user) {
    if (session.user.role === Role.TEACHER || session.user.role === Role.ADMIN)
      redirect("/dashboard");
    redirect("/portal/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 20% 0%, hsl(351 70% 88% / 0.55) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 100% 15%, hsl(38 80% 86% / 0.55) 0%, transparent 52%), radial-gradient(ellipse 70% 55% at 85% 100%, hsl(222 50% 84% / 0.4) 0%, transparent 55%)",
        }}
      />
      <div className="w-full max-w-sm space-y-5 animate-fade-in-up">
        <div className="flex justify-end">
          <LocaleSwitcher />
        </div>
        <Card className="shadow-elevated">
          <CardHeader className="items-center text-center">
            <OdysseyMark className="mb-1 h-14 w-14" />
            <CardTitle className="font-serif text-2xl text-primary">
              English Odyssey
            </CardTitle>
            <CardDescription>{t("welcomeBack")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {googleEnabled && (
              <>
                <form action={googleLoginAction}>
                  <Button variant="outline" type="submit" className="w-full">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                      />
                    </svg>
                    {t("signInWithGoogle")}
                  </Button>
                </form>
                {notRegistered && (
                  <p className="text-sm text-destructive">
                    {t("notRegistered")}
                  </p>
                )}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{t("or")}</span>
                  </div>
                </div>
              </>
            )}
            <form action={loginAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              {error && !notRegistered ? (
                <p className="text-sm text-destructive">
                  {t("wrongCredentials")}
                </p>
              ) : null}
              <Button type="submit" className="w-full">
                {t("signIn")}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {tCommon("language")}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
