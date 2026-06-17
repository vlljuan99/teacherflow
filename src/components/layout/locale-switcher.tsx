"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Select } from "@/components/ui/select";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const [, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    startTransition(() => router.refresh());
  }

  return (
    <Select
      aria-label={t("language")}
      defaultValue={locale}
      onChange={onChange}
      className="h-9 w-24"
    >
      <option value="es">{t("spanish")}</option>
      <option value="en">{t("english")}</option>
    </Select>
  );
}
