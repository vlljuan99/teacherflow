import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/db";
import {
  listClassroomCoursesAction,
  previewClassroomImport,
} from "@/server/actions/classroom-import";
import { ClassroomImportClient } from "@/components/materials/classroom-import-client";

export const dynamic = "force-dynamic";

export default async function ClassroomImportPage({
  searchParams,
}: {
  searchParams?: Promise<{ courseId?: string }>;
}) {
  const session = await requireRole(Role.TEACHER);
  const sp = (await searchParams) ?? {};

  const googleAccount = await prisma.googleAccount.findUnique({
    where: { userId: session.user.id },
  });
  if (!googleAccount) {
    return (
      <div className="space-y-4">
        <PageHeader title="Importar desde Classroom" />
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm">
              Conecta tu cuenta de Google primero para acceder a Classroom y Drive.
            </p>
            <Link href="/api/google/calendar/start">
              <Button>Conectar Google</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  let courses: Awaited<ReturnType<typeof listClassroomCoursesAction>> = [];
  let error: string | null = null;
  try {
    courses = await listClassroomCoursesAction();
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  // If no courseId in URL, show course picker
  if (!sp.courseId) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Importar desde Classroom"
          description="Sube a Azure Storage los adjuntos de Drive de un curso de Google Classroom."
        />
        {error && (
          <Card>
            <CardContent className="pt-6 text-sm text-destructive">
              Error: {error}. Es posible que necesites reconectar Google con los nuevos permisos
              de Classroom (ve a tu dashboard y vuelve a conectar).
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-6">
            {courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No se han encontrado cursos.</p>
            ) : (
              <ul className="divide-y">
                {courses.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.section ?? "—"}{" "}
                        {c.courseState && <Badge tone="muted">{c.courseState}</Badge>}
                      </div>
                    </div>
                    <Link href={`/materials/import?courseId=${encodeURIComponent(c.id)}`}>
                      <Button size="sm">Ver materiales</Button>
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

  let preview: Awaited<ReturnType<typeof previewClassroomImport>> | null = null;
  let previewError: string | null = null;
  try {
    preview = await previewClassroomImport(sp.courseId);
  } catch (err) {
    previewError = err instanceof Error ? err.message : String(err);
  }

  if (previewError || !preview) {
    return (
      <div className="space-y-4">
        <PageHeader title="Importar desde Classroom" />
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            Error: {previewError ?? "preview vacía"}
          </CardContent>
        </Card>
        <Link href="/materials/import">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>
    );
  }

  if (preview.totalDriveFiles === 0) {
    redirect(`/materials/import`);
  }

  return (
    <ClassroomImportClient
      courseId={preview.courseId}
      courseName={preview.courseName}
      topics={preview.topics}
      materials={preview.materials}
      totalDriveFiles={preview.totalDriveFiles}
    />
  );
}
