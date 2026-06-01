import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { AfropayCheckout } from "@/components/afropay-checkout";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ checkoutToken: string }> };

export default async function CheckoutPage({ params }: Props) {
  await connection();
  const { checkoutToken } = await params;
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { checkoutToken },
    include: { event: true, ticketType: true },
  });
  if (!transaction) notFound();
  if (transaction.status === "PAID") redirect(`/payment/${checkoutToken}`);

  return (
    <AfropayCheckout
      checkout={{
        checkoutToken: transaction.checkoutToken,
        reference: transaction.reference,
        eventName: transaction.event.name,
        ticketName: transaction.ticketType.name,
        accessType: transaction.ticketType.accessType,
        fullName: transaction.fullName,
        companyName: transaction.companyName ?? "",
        phone: transaction.phone ?? "",
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
      }}
    />
  );
}
