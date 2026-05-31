import { notFound } from "next/navigation";
import { AdeyLogo } from "@/components/adey-logo";
import { OrganizationSubmissionForm } from "@/components/organization-submission-form";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ eventId: string }> };

export default async function OrganizationSubmissionPage({ params }: Props) {
  const { eventId } = await params;
  const [event, categories] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.guestCategory.findMany({
      where: { name: { not: "Walk-In" } },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);
  if (!event) notFound();

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-3xl border p-5 sm:p-8" style={{ borderColor: "var(--stroke)", background: "var(--surface)", boxShadow: "var(--shadow-card)" }}>
          <AdeyLogo theme="light" />
          <p className="ap-kicker mt-8">Organization Guest Submission</p>
          <h1 className="mt-3 text-4xl font-black leading-tight">{event.name}</h1>
          <p className="mt-3 text-sm font-semibold ap-soft-text">
            Submit invited organization guests for admin review. Tickets are generated after approval.
          </p>
          <OrganizationSubmissionForm categories={categories.map((category) => category.name)} eventId={event.id} />
        </section>
      </div>
    </main>
  );
}
