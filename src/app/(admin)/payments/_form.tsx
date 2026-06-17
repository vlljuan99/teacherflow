import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PaymentMethod, PaymentStatus } from "@/lib/enums";
import type { Payment, Student } from "@prisma/client";
import { getTranslations } from "next-intl/server";

function dateInputValue(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export async function PaymentForm({
  action,
  students,
  payment,
}: {
  action: (formData: FormData) => Promise<void>;
  students: Pick<Student, "id" | "firstName" | "lastName">[];
  payment?: Payment | null;
}) {
  const t = await getTranslations("payments");
  const tCommon = await getTranslations("common");
  return (
    <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="studentId">{t("student")}</Label>
        <Select id="studentId" name="studentId" required defaultValue={payment?.studentId ?? ""}>
          <option value="">—</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.firstName} {s.lastName}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="concept">{t("concept")}</Label>
        <Input id="concept" name="concept" required defaultValue={payment?.concept ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="amount">{t("amount")}</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={payment ? (payment.amountCents / 100).toFixed(2) : ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="currency">{t("currency")}</Label>
        <Input id="currency" name="currency" defaultValue={payment?.currency ?? "EUR"} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dueDate">{t("dueDate")}</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          required
          defaultValue={dateInputValue(payment?.dueDate)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="paidAt">{t("paidAt")}</Label>
        <Input
          id="paidAt"
          name="paidAt"
          type="date"
          defaultValue={dateInputValue(payment?.paidAt)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="method">{t("method")}</Label>
        <Select id="method" name="method" defaultValue={payment?.method ?? PaymentMethod.TRANSFER}>
          {Object.values(PaymentMethod).map((m) => (
            <option key={m} value={m}>
              {t(`methodOptions.${m}`)}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">{t("status")}</Label>
        <Select id="status" name="status" defaultValue={payment?.status ?? PaymentStatus.PENDING}>
          {Object.values(PaymentStatus).map((s) => (
            <option key={s} value={s}>
              {t(`statusOptions.${s}`)}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={payment?.notes ?? ""} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit">{tCommon("save")}</Button>
      </div>
    </form>
  );
}
