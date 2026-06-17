import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EnglishLevel } from "@/lib/enums";
import type { Group } from "@prisma/client";
import { getTranslations } from "next-intl/server";

export async function GroupForm({
  action,
  group,
}: {
  action: (formData: FormData) => Promise<void>;
  group?: Group | null;
}) {
  const t = await getTranslations("groups");
  const tCommon = await getTranslations("common");
  const tLevel = await getTranslations("level");
  return (
    <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" required defaultValue={group?.name ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="level">{t("level")}</Label>
        <Select id="level" name="level" defaultValue={group?.level ?? EnglishLevel.A1}>
          {Object.values(EnglishLevel).map((l) => (
            <option key={l} value={l}>
              {tLevel(l)}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="schedule">{t("schedule")}</Label>
        <Input id="schedule" name="schedule" defaultValue={group?.schedule ?? ""} />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={group?.description ?? ""}
        />
      </div>
      <div className="md:col-span-2">
        <Button type="submit">{tCommon("save")}</Button>
      </div>
    </form>
  );
}
