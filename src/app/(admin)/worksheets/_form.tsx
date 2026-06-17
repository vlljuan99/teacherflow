import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EnglishLevel, WorksheetLanguage, WorksheetStatus } from "@/lib/enums";
import type { Worksheet } from "@prisma/client";
import { getTranslations } from "next-intl/server";

export async function WorksheetForm({
  action,
  worksheet,
}: {
  action: (formData: FormData) => Promise<void>;
  worksheet?: Worksheet | null;
}) {
  const t = await getTranslations("worksheets");
  const tCommon = await getTranslations("common");
  const tLevel = await getTranslations("level");
  return (
    <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="title">{t("titleField")}</Label>
        <Input id="title" name="title" required defaultValue={worksheet?.title ?? ""} />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={worksheet?.description ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="level">{t("level")}</Label>
        <Select id="level" name="level" defaultValue={worksheet?.level ?? EnglishLevel.A1}>
          {Object.values(EnglishLevel).map((l) => (
            <option key={l} value={l}>
              {tLevel(l)}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="topic">{t("topic")}</Label>
        <Input id="topic" name="topic" defaultValue={worksheet?.topic ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="language">{t("language")}</Label>
        <Select
          id="language"
          name="language"
          defaultValue={worksheet?.language ?? WorksheetLanguage.EN}
        >
          {Object.values(WorksheetLanguage).map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">{t("status")}</Label>
        <Select
          id="status"
          name="status"
          defaultValue={worksheet?.status ?? WorksheetStatus.DRAFT}
        >
          {Object.values(WorksheetStatus).map((s) => (
            <option key={s} value={s}>
              {tCommon(s.toLowerCase() as "draft" | "published" | "archived")}
            </option>
          ))}
        </Select>
      </div>
      <div className="md:col-span-2">
        <Button type="submit">{tCommon("save")}</Button>
      </div>
    </form>
  );
}
