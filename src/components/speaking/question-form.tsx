import { getTranslations } from "next-intl/server";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  EnglishLevel,
  MaterialTrack,
  SpeakingTwist,
  TRACK_ORDER,
} from "@/lib/enums";

export interface SpeakingFormValues {
  prompt: string;
  level: string;
  track: string;
  category: string;
  points: number;
  twist: string;
  isActive: boolean;
}

export async function SpeakingQuestionForm({
  initial,
  action,
}: {
  initial: SpeakingFormValues;
  action: (formData: FormData) => Promise<void>;
}) {
  const t = await getTranslations("speaking");
  const tMat = await getTranslations("materials");
  const tCommon = await getTranslations("common");

  return (
    <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="prompt">{t("prompt")}</Label>
        <Textarea
          id="prompt"
          name="prompt"
          required
          rows={3}
          defaultValue={initial.prompt}
          placeholder={t("promptPlaceholder")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="level">{tMat("level")}</Label>
        <Select id="level" name="level" defaultValue={initial.level}>
          <option value="">{tMat("anyLevel")}</option>
          {Object.values(EnglishLevel).map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="track">{tMat("track")}</Label>
        <Select id="track" name="track" defaultValue={initial.track}>
          <option value="">{tMat("anyTrack")}</option>
          {TRACK_ORDER.map((tr) => (
            <option key={tr} value={tr}>
              {tMat(`trackOptions.${tr}` as `trackOptions.${MaterialTrack}`)}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category">{t("category")}</Label>
        <Input
          id="category"
          name="category"
          defaultValue={initial.category}
          placeholder={t("categoryPlaceholder")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="points">{t("points")}</Label>
        <Input
          id="points"
          name="points"
          type="number"
          min={1}
          max={50}
          defaultValue={initial.points}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="twist">{t("twist")}</Label>
        <Select id="twist" name="twist" defaultValue={initial.twist}>
          <option value="">{t("twistNone")}</option>
          {Object.values(SpeakingTwist).map((tw) => (
            <option key={tw} value={tw}>
              {t(`twistOptions.${tw}` as `twistOptions.${SpeakingTwist}`)}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          defaultChecked={initial.isActive}
          className="h-4 w-4"
        />
        <Label htmlFor="isActive">{t("active")}</Label>
      </div>
      <div className="md:col-span-2">
        <Button type="submit">{tCommon("save")}</Button>
      </div>
    </form>
  );
}
