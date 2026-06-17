"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pencil, Trash2, Search, X, Users2, User } from "lucide-react";
import { EnglishLevel, StudentStatus } from "@/lib/enums";
import { deleteStudent } from "@/server/actions/students";

export interface StudentListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  level: string;
  status: string;
  isMinor: boolean;
  photoUrl: string | null;
  group: { id: string; name: string } | null;
}

export function StudentsList({ students }: { students: StudentListItem[] }) {
  const t = useTranslations("students");
  const tCommon = useTranslations("common");
  const tLevel = useTranslations("level");

  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");
  const [groupMode, setGroupMode] = useState<"" | "individual" | "in_group">("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (level && s.level !== level) return false;
      if (status && s.status !== status) return false;
      if (groupMode === "individual" && s.group) return false;
      if (groupMode === "in_group" && !s.group) return false;
      if (q) {
        const blob = `${s.firstName} ${s.lastName} ${s.email ?? ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [students, query, level, status, groupMode]);

  const hasFilters = query || level || status || groupMode;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pl-9"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("filterLevel")}</label>
            <Select value={level} onChange={(e) => setLevel(e.target.value)} className="min-w-[110px]">
              <option value="">{t("filterAll")}</option>
              {Object.values(EnglishLevel).map((l) => (
                <option key={l} value={l}>
                  {tLevel(l)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("filterStatus")}</label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="min-w-[130px]">
              <option value="">{t("filterAll")}</option>
              {Object.values(StudentStatus).map((s) => (
                <option key={s} value={s}>
                  {t(`statusOptions.${s}`)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("filterGroup")}</label>
            <Select
              value={groupMode}
              onChange={(e) => setGroupMode(e.target.value as typeof groupMode)}
              className="min-w-[140px]"
            >
              <option value="">{t("filterAll")}</option>
              <option value="individual">{t("filterIndividual")}</option>
              <option value="in_group">{t("filterAnyGroup")}</option>
            </Select>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setLevel("");
                setStatus("");
                setGroupMode("");
              }}
            >
              <X className="h-4 w-4" /> {t("clearFilters")}
            </Button>
          )}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title={t("noMatches")} />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{t("firstName")}</TH>
                <TH>{t("level")}</TH>
                <TH>{t("group")}</TH>
                <TH>{t("status")}</TH>
                <TH>{t("email")}</TH>
                <TH className="text-right">{tCommon("actions")}</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((s) => (
                <TR key={s.id} className="hover:bg-muted/40">
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={s.photoUrl}
                        name={`${s.firstName} ${s.lastName}`}
                        size="sm"
                      />
                      <div>
                        <Link
                          className="font-medium hover:underline"
                          href={`/students/${s.id}`}
                        >
                          {s.firstName} {s.lastName}
                        </Link>
                        {s.isMinor && (
                          <Badge tone="info" className="ml-2">
                            {t("isMinor")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <Badge tone="default">{s.level}</Badge>
                  </TD>
                  <TD>
                    {s.group ? (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <Users2 className="h-3.5 w-3.5 text-accent" />
                        <Link href={`/groups/${s.group.id}`} className="hover:underline">
                          {s.group.name}
                        </Link>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        {t("individual")}
                      </span>
                    )}
                  </TD>
                  <TD>
                    <Badge
                      tone={
                        s.status === "ACTIVE"
                          ? "success"
                          : s.status === "PENDING"
                            ? "warning"
                            : "muted"
                      }
                    >
                      {t(`statusOptions.${s.status}`)}
                    </Badge>
                  </TD>
                  <TD className="text-muted-foreground">{s.email ?? "—"}</TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/students/${s.id}/edit`}>
                        <Button size="sm" variant="ghost" title={tCommon("edit")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteStudentButton id={s.id} name={`${s.firstName} ${s.lastName}`} />
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function DeleteStudentButton({ id, name }: { id: string; name: string }) {
  const tCommon = useTranslations("common");
  return (
    <form
      action={deleteStudent.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm(`${tCommon("delete")} — ${name}?`)) e.preventDefault();
      }}
    >
      <Button
        size="sm"
        variant="ghost"
        type="submit"
        title={tCommon("delete")}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}
