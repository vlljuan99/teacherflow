import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MeetLinkField } from "@/components/students/meet-link-field";
import { EnglishLevel, StudentStatus, TRACK_ORDER } from "@/lib/enums";
import type { Group, Student } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { UserCircle } from "lucide-react";

export async function StudentForm({
  action,
  groups,
  teachers,
  student,
}: {
  action: (formData: FormData) => Promise<void>;
  groups: Group[];
  teachers: { id: string; name: string }[];
  student?: Student | null;
}) {
  const t = await getTranslations("students");
  const tCommon = await getTranslations("common");
  const tLevel = await getTranslations("level");
  const tMaterials = await getTranslations("materials");
  const selectedTracks = new Set(
    (student?.allowedTracks ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  );
  return (
    <form action={action} encType="multipart/form-data" className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="md:col-span-2 flex items-center gap-4 rounded-lg border bg-card/50 p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-muted">
          {student?.photoUrl ? (
            <Image
              src={student.photoUrl}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <UserCircle className="h-10 w-10" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="photo">{t("photo")}</Label>
          <Input
            id="photo"
            name="photo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />
          <p className="text-xs text-muted-foreground">{t("photoHint")}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="firstName">{t("firstName")}</Label>
        <Input
          id="firstName"
          name="firstName"
          required
          defaultValue={student?.firstName ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lastName">{t("lastName")}</Label>
        <Input
          id="lastName"
          name="lastName"
          required
          defaultValue={student?.lastName ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={student?.email ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input id="phone" name="phone" defaultValue={student?.phone ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="birthDate">{t("birthDate")}</Label>
        <Input
          id="birthDate"
          name="birthDate"
          type="date"
          defaultValue={
            student?.birthDate
              ? new Date(student.birthDate).toISOString().slice(0, 10)
              : ""
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="level">{t("level")}</Label>
        <Select id="level" name="level" defaultValue={student?.level ?? EnglishLevel.A1}>
          {Object.values(EnglishLevel).map((l) => (
            <option key={l} value={l}>
              {tLevel(l)}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">{t("status")}</Label>
        <Select id="status" name="status" defaultValue={student?.status ?? StudentStatus.ACTIVE}>
          {Object.values(StudentStatus).map((s) => (
            <option key={s} value={s}>
              {t(`statusOptions.${s}`)}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="groupId">{t("group")}</Label>
        <Select id="groupId" name="groupId" defaultValue={student?.groupId ?? ""}>
          <option value="">{t("individual")}</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="teacherId">{t("teacher")}</Label>
        <Select
          id="teacherId"
          name="teacherId"
          defaultValue={student?.teacherId ?? ""}
        >
          <option value="">{t("noTeacher")}</option>
          {teachers.map((tch) => (
            <option key={tch.id} value={tch.id}>
              {tch.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="meetLink">{t("meetLink")}</Label>
        <MeetLinkField
          name="meetLink"
          defaultValue={student?.meetLink}
          studentId={student?.id}
        />
        <p className="text-xs text-muted-foreground">{t("meetLinkHint")}</p>
      </div>
      <div className="flex items-center gap-2 md:col-span-2">
        <input
          id="isMinor"
          name="isMinor"
          type="checkbox"
          defaultChecked={student?.isMinor ?? false}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="isMinor">{t("isMinor")}</Label>
      </div>

      <div className="space-y-2 rounded-lg border bg-card/50 p-4 md:col-span-2">
        <Label>{t("notifications")}</Label>
        <p className="text-xs text-muted-foreground">{t("notifyHint")}</p>
        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:gap-6">
          <label htmlFor="notifyEmail" className="flex items-center gap-2 text-sm">
            <input
              id="notifyEmail"
              name="notifyEmail"
              type="checkbox"
              defaultChecked={student?.notifyEmail ?? true}
              className="h-4 w-4 rounded border-input"
            />
            {t("notifyEmail")}
          </label>
          <label
            htmlFor="notifyWhatsapp"
            className="flex items-center gap-2 text-sm"
          >
            <input
              id="notifyWhatsapp"
              name="notifyWhatsapp"
              type="checkbox"
              defaultChecked={student?.notifyWhatsapp ?? false}
              className="h-4 w-4 rounded border-input"
            />
            {t("notifyWhatsapp")}
          </label>
        </div>
      </div>
      <div className="space-y-2 rounded-lg border bg-card/50 p-4 md:col-span-2">
        <Label>{t("allowedTracks")}</Label>
        <p className="text-xs text-muted-foreground">{t("allowedTracksHint")}</p>
        <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
          {TRACK_ORDER.map((tr) => (
            <label key={tr} htmlFor={`track-${tr}`} className="flex items-center gap-2 text-sm">
              <input
                id={`track-${tr}`}
                name="allowedTracks"
                type="checkbox"
                value={tr}
                defaultChecked={selectedTracks.has(tr)}
                className="h-4 w-4 rounded border-input"
              />
              {tMaterials(`trackOptions.${tr}`)}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={student?.notes ?? ""}
        />
      </div>
      <div className="md:col-span-2">
        <Button type="submit">{tCommon("save")}</Button>
      </div>
    </form>
  );
}
