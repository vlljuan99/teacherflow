import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ShieldOff } from "lucide-react";
import { revokeConsent, deleteConsent } from "@/server/actions/consents";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/utils";

export default async function ConsentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("consents");
  const tCommon = await getTranslations("common");
  const c = await prisma.consent.findUnique({
    where: { id },
    include: { student: true, guardian: true },
  });
  if (!c) notFound();
  return (
    <div className="space-y-6">
      <PageHeader
        title={t(`typeOptions.${c.type}`)}
        description={`${t("version")} ${c.version}`}
        actions={
          <div className="flex gap-2">
            {c.status === "ACCEPTED" && (
              <form
                action={async () => {
                  "use server";
                  await revokeConsent(c.id);
                }}
              >
                <Button variant="outline" type="submit">
                  <ShieldOff className="h-4 w-4" /> {t("revoke")}
                </Button>
              </form>
            )}
            <form
              action={async () => {
                "use server";
                await deleteConsent(c.id);
              }}
            >
              <Button variant="destructive" type="submit">
                <Trash2 className="h-4 w-4" /> {tCommon("delete")}
              </Button>
            </form>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{tCommon("details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">{t("status")}: </span>
            <Badge tone={c.status === "ACCEPTED" ? "success" : "muted"}>
              {t(`statusOptions.${c.status}`)}
            </Badge>
          </p>
          <p>
            <span className="text-muted-foreground">{t("acceptedBy")}: </span>
            {c.acceptedByName}
          </p>
          <p>
            <span className="text-muted-foreground">{t("acceptedAt")}: </span>
            {formatDate(c.acceptedAt)}
          </p>
          {c.revokedAt && (
            <p>
              <span className="text-muted-foreground">{t("revokedAt")}: </span>
              {formatDate(c.revokedAt)}
            </p>
          )}
          {c.student && (
            <p>
              <span className="text-muted-foreground">Alumno: </span>
              <Link className="hover:underline" href={`/students/${c.student.id}`}>
                {c.student.firstName} {c.student.lastName}
              </Link>
            </p>
          )}
          {c.guardian && (
            <p>
              <span className="text-muted-foreground">Tutor: </span>
              <Link className="hover:underline" href={`/guardians/${c.guardian.id}`}>
                {c.guardian.firstName} {c.guardian.lastName}
              </Link>
            </p>
          )}
          {c.ip && (
            <p>
              <span className="text-muted-foreground">IP: </span>
              {c.ip}
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("text")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{c.text}</p>
        </CardContent>
      </Card>
    </div>
  );
}
