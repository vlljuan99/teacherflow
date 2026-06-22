import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, Wand2, FileText } from "lucide-react";
import { deleteMaterial, updateMaterialMeta } from "@/server/actions/materials";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TRACK_ORDER, TRACK_SUBSECTIONS, MaterialTrack } from "@/lib/enums";
import { convertPdfToWorksheet } from "@/server/actions/pdf-convert";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/utils";

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tCommon = await getTranslations("common");
  const tMat = await getTranslations("materials");
  const m = await prisma.material.findUnique({
    where: { id },
    include: {
      links: { include: { worksheet: true } },
      pdfImport: { select: { worksheetId: true } },
    },
  });
  if (!m) notFound();
  const worksheetLinks = m.links.filter((l) => l.worksheet);
  const isPdf = m.type === "PDF" || m.mime === "application/pdf";
  const existingWorksheetId = m.pdfImport?.worksheetId;
  return (
    <div className="space-y-6">
      <PageHeader
        title={m.title}
        description={`${m.mime} · ${(m.size / 1024).toFixed(1)} KB · ${formatDate(m.createdAt)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <a href={`/api/files/${m.id}`} target="_blank" rel="noreferrer">
              <Button variant="outline">
                <Download className="h-4 w-4" /> {tCommon("open")}
              </Button>
            </a>
            {isPdf && (
              existingWorksheetId ? (
                <Link href={`/worksheets/${existingWorksheetId}/review`}>
                  <Button variant="outline">
                    <FileText className="h-4 w-4" /> Ver ficha generada
                  </Button>
                </Link>
              ) : (
                <form
                  action={async () => {
                    "use server";
                    await convertPdfToWorksheet(m.id);
                  }}
                >
                  <Button type="submit" variant="outline">
                    <Wand2 className="h-4 w-4" /> Convertir a Ficha con IA
                  </Button>
                </form>
              )
            )}
            <form
              action={async () => {
                "use server";
                await deleteMaterial(m.id);
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
        <CardContent className="pt-6">
          <form
            action={async (fd: FormData) => {
              "use server";
              await updateMaterialMeta(m.id, fd);
            }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="track">{tMat("track")}</Label>
              <Select id="track" name="track" defaultValue={m.track ?? ""}>
                <option value="">{tMat("anyTrack")}</option>
                {TRACK_ORDER.map((tr) => (
                  <option key={tr} value={tr}>
                    {tMat(`trackOptions.${tr}`)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subSection">{tMat("subSection")}</Label>
              <Input
                id="subSection"
                name="subSection"
                defaultValue={m.subSection ?? ""}
                list="subsection-suggestions"
              />
              <datalist id="subsection-suggestions">
                {Array.from(
                  new Set(
                    m.track && TRACK_SUBSECTIONS[m.track as MaterialTrack]
                      ? TRACK_SUBSECTIONS[m.track as MaterialTrack]
                      : Object.values(TRACK_SUBSECTIONS).flat(),
                  ),
                ).map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="md:col-span-2">
              <Button type="submit">{tCommon("save")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 pt-6">
          <h2 className="text-sm font-medium">Visibilidad</h2>
          <p className="text-sm text-muted-foreground">
            Este material es <strong>público para todos los alumnos</strong> de la
            academia. No se asocia a un alumno o grupo concreto.
          </p>
          {worksheetLinks.length > 0 && (
            <>
              <h2 className="mt-4 text-sm font-medium">Vinculado a fichas</h2>
              <ul className="space-y-1 text-sm">
                {worksheetLinks.map((l) => (
                  <li key={l.id} className="flex items-center gap-2">
                    <Badge tone="info">Ficha</Badge>
                    <Link
                      href={`/worksheets/${l.worksheet!.id}/edit`}
                      className="hover:underline"
                    >
                      {l.worksheet!.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
