import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentReceipt } from "@/components/payment-receipt";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ checkoutToken: string }> };

export default async function PaymentPage({ params }: Props) {
  await connection();
  const { checkoutToken } = await params;
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { checkoutToken },
    include: { event: true, ticketType: true },
  });
  if (!transaction) notFound();

  if (transaction.status !== "PAID") {
    return (
      <main className="grid min-h-screen place-items-center px-4 py-8" style={{ background: "var(--afropay-soft)", color: "var(--afropay-ink)" }}>
        <section className="max-w-md rounded-[2rem] border border-slate-100 bg-white p-6 text-center shadow-[0_28px_90px_rgba(15,23,42,0.10)]">
          <div className="text-3xl font-black" style={{ color: "var(--afropay-blue)" }}>Afropay</div>
          <h1 className="mt-5 text-2xl font-black">Payment is still pending</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">Complete checkout to unlock the downloadable QR ticket.</p>
          <Link className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-black text-white" href={`/checkout/${checkoutToken}`} style={{ background: "var(--afropay-blue)" }}>Return to checkout</Link>
        </section>
      </main>
    );
  }

  return (
    <PaymentReceipt
      payment={{
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
        method: transaction.method ?? "Afropay",
        paidAt: transaction.paidAt?.toISOString() ?? transaction.updatedAt.toISOString(),
        status: transaction.status,
      }}
    />
  );
}
