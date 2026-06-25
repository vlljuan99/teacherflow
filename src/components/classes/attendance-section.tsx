import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClipboardCheck } from "lucide-react";
import { ATTENDANCE_ORDER, AttendanceStatus } from "@/lib/enums";

export interface RosterStudent {
  id: string;
  firstName: string;
  lastName: string;
}

export async function AttendanceSection({
  roster,
  existing,
  action,
}: {
  roster: RosterStudent[];
  existing: Record<string, { status: string; note: string | null }>;
  action: (formData: FormData) => Promise<void>;
}) {
  const t = await getTranslations("attendance");
  const tCommon = await getTranslations("common");

  if (roster.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" /> {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("noRoster")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" /> {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-3">
          {roster.map((s) => {
            const current = existing[s.id]?.status ?? AttendanceStatus.PRESENT;
            return (
              <div
                key={s.id}
                className="flex flex-col gap-2 rounded-xl border bg-card/50 p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1 truncate text-sm font-medium">
                  {s.firstName} {s.lastName}
                </div>
                <Select
                  name={`status_${s.id}`}
                  defaultValue={current}
                  className="sm:w-44"
                >
                  {ATTENDANCE_ORDER.map((st) => (
                    <option key={st} value={st}>
                      {t(`statusOptions.${st}`)}
                    </option>
                  ))}
                </Select>
                <Input
                  name={`note_${s.id}`}
                  defaultValue={existing[s.id]?.note ?? ""}
                  placeholder={t("notePlaceholder")}
                  className="sm:w-56"
                />
              </div>
            );
          })}
          <Button type="submit">{tCommon("save")}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
