import Image from "next/image";
import { UserCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Role } from "@/lib/enums";
import { requireRole } from "@/server/auth/session";
import { updateProfile, changePassword } from "@/server/actions/profile";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ pw?: string }>;
}) {
  const session = await requireRole(Role.TEACHER);
  const t = await getTranslations("profile");
  const tCommon = await getTranslations("common");
  const { pw } = (await searchParams) ?? {};
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      photoUrl: true,
      contactEmail: true,
      contactPhone: true,
      contactWhatsapp: true,
      contactNote: true,
      passwordHash: true,
    },
  });
  const hasPassword = Boolean(user?.passwordHash);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Card>
        <CardContent className="pt-6">
          <form
            action={updateProfile}
            encType="multipart/form-data"
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div className="md:col-span-2 flex items-center gap-4 rounded-lg border bg-card/50 p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-muted">
                {user?.photoUrl ? (
                  <Image
                    src={user.photoUrl}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <UserCircle className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="photo">{t("photo")}</Label>
                <Input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                />
                <p className="text-xs text-muted-foreground">{t("photoHint")}</p>
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>{t("account")}</Label>
              <p className="text-sm text-muted-foreground">
                {user?.name} · {user?.email}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">{t("contactEmail")}</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                placeholder={user?.email ?? "profe@example.com"}
                defaultValue={user?.contactEmail ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactPhone">{t("contactPhone")}</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                placeholder="+34 600 000 000"
                defaultValue={user?.contactPhone ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactWhatsapp">{t("contactWhatsapp")}</Label>
              <Input
                id="contactWhatsapp"
                name="contactWhatsapp"
                placeholder="+34 600 000 000"
                defaultValue={user?.contactWhatsapp ?? ""}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="contactNote">{t("contactNote")}</Label>
              <Textarea
                id="contactNote"
                name="contactNote"
                rows={3}
                placeholder={t("contactNotePlaceholder")}
                defaultValue={user?.contactNote ?? ""}
              />
              <p className="text-xs text-muted-foreground">{t("contactHint")}</p>
            </div>

            <div className="md:col-span-2">
              <Button type="submit">{tCommon("save")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold">{t("password")}</h2>
            <p className="text-sm text-muted-foreground">
              {hasPassword ? t("passwordHint") : t("passwordSetHint")}
            </p>
          </div>

          {pw === "ok" && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              {t("pwOk")}
            </div>
          )}
          {pw && pw !== "ok" && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="h-4 w-4" />
              {t(
                pw === "bad"
                  ? "pwBad"
                  : pw === "mismatch"
                    ? "pwMismatch"
                    : "pwShort",
              )}
            </div>
          )}

          <form
            action={changePassword}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {hasPassword && (
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">{t("newPassword")}</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">{t("changePassword")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
