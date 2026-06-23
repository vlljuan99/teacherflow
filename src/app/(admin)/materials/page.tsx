import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Cloud, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { EnglishLevel, ExamType, MaterialCategory } from "@/lib/enums";
import { MaterialFilters } from "@/components/materials/material-filters";
import { ConvertPdfButton } from "@/components/materials/convert-pdf-button";

export const dynamic = "force-dynamic";

type Search = { level?: string; examType?: string; category?: string; q?: string };

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams?: Promise<Search>;
}) {
  const t = await getTranslations("materials");
  const tCommon = await getTranslations("common");
  const sp = (await searchParams) ?? {};
  const where: Record<string, unknown> = {};
  if (sp.level && (Object.values(EnglishLevel) as string[]).includes(sp.level)) {
    where.level = sp.level;
  }
  if (sp.examType && (Object.values(ExamType) as string[]).includes(sp.examType)) {
    where.examType = sp.examType;
  }
  if (sp.category && (Object.values(MaterialCategory) as string[]).includes(sp.category)) {
    where.category = sp.category;
  }
  if (sp.q && sp.q.trim()) {
    where.title = { contains: sp.q.trim(), mode: "insensitive" };
  }

  const materials = await prisma.material.findMany({
    where,
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
    include: { pdfImport: { select: { worksheetId: true } } },
  });

  const grouped = new Map<string, typeof materials>();
  for (const m of materials) {
    const key = m.category || MaterialCategory.OTHER;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(m);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description="Visibles para todos los alumnos. Para asignar ejercicios a un alumno concreto, usa Fichas."
        actions={
          <div className="flex gap-2">
            <Link href="/materials/import">
              <Button variant="outline">
                <Cloud className="h-4 w-4" /> {t("importFromClassroom")}
              </Button>
            </Link>
            <Link href="/materials/new">
              <Button>
                <Plus className="h-4 w-4" /> {t("new")}
              </Button>
            </Link>
          </div>
        }
      />

      <MaterialFilters
        initial={{
          level: sp.level ?? "",
          examType: sp.examType ?? "",
          category: sp.category ?? "",
          q: sp.q ?? "",
        }}
      />

      {grouped.size === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {tCommon("noResults")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([cat, items]) => (
            <Card key={cat}>
              <CardContent className="pt-6">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(`categoryOptions.${cat as MaterialCategory}`)}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                    {items.length}
                  </span>
                </h2>
                <ul className="divide-y">
                  {items.map((m) => {
                    const isPdf = m.type === "PDF" || m.mime === "application/pdf";
                    const existingWorksheetId = m.pdfImport?.worksheetId;
                    return (
                    <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/materials/${m.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {m.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                          <Badge tone="info">
                            {t(`typeOptions.${m.type as "PDF" | "IMAGE" | "AUDIO" | "DOCUMENT"}`)}
                          </Badge>
                          {m.level && <Badge tone="muted">{m.level}</Badge>}
                          {m.examType && (
                            <Badge tone="default">
                              {t(`examOptions.${m.examType as ExamType}`)}
                            </Badge>
                          )}
                          <span className="text-muted-foreground">
                            {formatDate(m.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {isPdf && (
                          existingWorksheetId ? (
                            <Link href={`/worksheets/${existingWorksheetId}/review`}>
                              <Button variant="outline" size="sm">
                                <FileText className="h-3.5 w-3.5" /> Ver ficha
                              </Button>
                            </Link>
                          ) : (
                            <ConvertPdfButton materialId={m.id} />
                          )
                        )}
                        <a
                          href={`/api/files/${m.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-sm text-primary hover:underline"
                        >
                          <Download className="inline h-3.5 w-3.5" /> {tCommon("open")}
                        </a>
                      </div>
                    </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
