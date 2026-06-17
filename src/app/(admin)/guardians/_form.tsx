import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import type { Guardian } from "@prisma/client";

export async function GuardianForm({
  action,
  guardian,
}: {
  action: (formData: FormData) => Promise<void>;
  guardian?: Guardian | null;
}) {
  const t = await getTranslations("guardians");
  const tCommon = await getTranslations("common");
  return (
    <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="firstName">{t("firstName")}</Label>
        <Input id="firstName" name="firstName" required defaultValue={guardian?.firstName ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lastName">{t("lastName")}</Label>
        <Input id="lastName" name="lastName" required defaultValue={guardian?.lastName ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" defaultValue={guardian?.email ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input id="phone" name="phone" defaultValue={guardian?.phone ?? ""} />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="relationship">{t("relationship")}</Label>
        <Input id="relationship" name="relationship" defaultValue={guardian?.relationship ?? ""} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit">{tCommon("save")}</Button>
      </div>
    </form>
  );
}
