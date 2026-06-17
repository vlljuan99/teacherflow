import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { GroupForm } from "../_form";
import { updateGroup, deleteGroup } from "@/server/actions/groups";
import { getTranslations } from "next-intl/server";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("groups");
  const tCommon = await getTranslations("common");
  const group = await prisma.group.findUnique({
    where: { id },
    include: { students: { orderBy: { lastName: "asc" } } },
  });
  if (!group) notFound();
  const action = async (formData: FormData) => {
    "use server";
    await updateGroup(group.id, formData);
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title={group.name}
        description={group.level}
        actions={
          <form
            action={async () => {
              "use server";
              await deleteGroup(group.id);
            }}
          >
            <Button variant="destructive" type="submit">
              <Trash2 className="h-4 w-4" /> {tCommon("delete")}
            </Button>
          </form>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{tCommon("edit")}</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupForm action={action} group={group} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("students")}</CardTitle>
        </CardHeader>
        <CardContent>
          {group.students.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tCommon("noResults")}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {group.students.map((s) => (
                <li key={s.id}>
                  <Link className="hover:underline" href={`/students/${s.id}`}>
                    {s.firstName} {s.lastName} · {s.level}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
