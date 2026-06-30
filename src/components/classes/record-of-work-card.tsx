"use client";

import { useTranslations } from "next-intl";
import { Printer, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RecordValues {
  warmUp: string;
  mainTask: string;
  homework: string;
  notes: string;
}

export function RecordOfWorkCard({
  action,
  values,
  group,
  time,
}: {
  action: (formData: FormData) => void;
  values: RecordValues;
  group: string;
  time: string;
}) {
  const t = useTranslations("recordOfWork");

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="no-print mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t("title")}</h2>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" /> {t("print")}
          </Button>
        </div>

        <form action={action}>
          {/* The sheet mirrors the teacher's paper template. */}
          <div className="record-sheet overflow-hidden rounded-lg border border-foreground/40">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <ReadCell label={t("group")} value={group} className="sm:border-r" />
              <ReadCell label={t("time")} value={time} className="border-t sm:border-t-0" />
            </div>
            <div className="grid grid-cols-1 border-t border-foreground/40 sm:grid-cols-2">
              <FieldCell
                label={t("warmUp")}
                name="warmUp"
                defaultValue={values.warmUp}
                rows={6}
                className="sm:border-r"
              />
              <FieldCell
                label={t("mainTask")}
                name="mainTask"
                defaultValue={values.mainTask}
                rows={6}
                className="border-t sm:border-t-0"
              />
            </div>
            <div className="grid grid-cols-1 border-t border-foreground/40 sm:grid-cols-2">
              <FieldCell
                label={t("homework")}
                name="homework"
                defaultValue={values.homework}
                rows={4}
                className="sm:border-r"
              />
              <FieldCell
                label={t("notes")}
                name="notes"
                defaultValue={values.notes}
                rows={4}
                className="border-t sm:border-t-0"
              />
            </div>
          </div>

          <div className="no-print mt-4">
            <Button type="submit">
              <Save className="h-4 w-4" /> {t("title")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ReadCell({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline gap-2 p-3 ${className ?? ""}`}>
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}:
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function FieldCell({
  label,
  name,
  defaultValue,
  rows,
  className,
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col border-foreground/40 ${className ?? ""}`}>
      <span className="px-3 pt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}:
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        maxLength={2000}
        className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-0"
      />
    </div>
  );
}
