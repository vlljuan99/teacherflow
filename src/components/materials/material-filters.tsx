"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { EnglishLevel, ExamType, MaterialCategory } from "@/lib/enums";

export function MaterialFilters({
  initial,
}: {
  initial: { level: string; examType: string; category: string; q: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const t = useTranslations("materials");
  const tCommon = useTranslations("common");

  function update(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{tCommon("search")}</label>
          <Input
            defaultValue={initial.q}
            placeholder={tCommon("search")}
            onChange={(e) => update("q", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("category")}</label>
          <Select value={initial.category} onChange={(e) => update("category", e.target.value)}>
            <option value="">{t("allCategories")}</option>
            {Object.values(MaterialCategory).map((c) => (
              <option key={c} value={c}>
                {t(`categoryOptions.${c}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("level")}</label>
          <Select value={initial.level} onChange={(e) => update("level", e.target.value)}>
            <option value="">{t("anyLevel")}</option>
            {Object.values(EnglishLevel).map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("examType")}</label>
          <Select value={initial.examType} onChange={(e) => update("examType", e.target.value)}>
            <option value="">{t("anyExam")}</option>
            {Object.values(ExamType).map((e) => (
              <option key={e} value={e}>
                {t(`examOptions.${e}`)}
              </option>
            ))}
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
