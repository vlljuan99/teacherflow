import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { PaymentForm } from "../_form";
import { updatePayment, deletePayment } from "@/server/actions/payments";
import { getTranslations } from "next-intl/server";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tCommon = await getTranslations("common");
  const [payment, students] = await Promise.all([
    prisma.payment.findUnique({ where: { id } }),
    prisma.student.findMany({
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);
  if (!payment) notFound();
  const action = async (formData: FormData) => {
    "use server";
    await updatePayment(payment.id, formData);
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title={payment.concept}
        actions={
          <form
            action={async () => {
              "use server";
              await deletePayment(payment.id);
            }}
          >
            <Button variant="destructive" type="submit">
              <Trash2 className="h-4 w-4" /> {tCommon("delete")}
            </Button>
          </form>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <PaymentForm action={action} students={students} payment={payment} />
        </CardContent>
      </Card>
    </div>
  );
}
