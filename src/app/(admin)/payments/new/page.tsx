import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentForm } from "../_form";
import { createPayment } from "@/server/actions/payments";
import { getTranslations } from "next-intl/server";

export default async function NewPaymentPage() {
  const t = await getTranslations("payments");
  const students = await prisma.student.findMany({
    orderBy: { lastName: "asc" },
    select: { id: true, firstName: true, lastName: true },
  });
  return (
    <div>
      <PageHeader title={t("new")} />
      <Card>
        <CardContent className="pt-6">
          <PaymentForm action={createPayment} students={students} />
        </CardContent>
      </Card>
    </div>
  );
}
