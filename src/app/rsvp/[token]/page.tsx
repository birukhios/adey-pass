import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AdeyLogo } from "@/components/adey-logo";
import { RsvpForm } from "@/components/rsvp-form";
import { Badge } from "@/components/ui";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ token: string }> };

export default async function RsvpPage({ params }: Props) {
  await connection();
  const { token } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { guest: { include: { event: true, category: true } } },
  });
  if (!invitation) notFound();

  if (!invitation.openedAt) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: invitation.status === "DRAFT" ? "OPENED" : invitation.status, openedAt: new Date() },
    });
  }

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-lg">
        <div className="rounded-3xl border p-5" style={{ borderColor: "var(--stroke)", background: "var(--surface)", boxShadow: "var(--shadow-card)" }}>
          <AdeyLogo theme="light" />
          <p className="ap-kicker mt-8">Invitation RSVP</p>
          <h1 className="mt-3 text-4xl font-black leading-tight">{invitation.guest.event.name}</h1>
          <p className="mt-3 text-sm font-semibold ap-soft-text">
            {invitation.guest.event.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {invitation.guest.event.venueName}
          </p>
          <div className="mt-5 rounded-3xl p-4" style={{ background: "var(--surface-muted)" }}>
            <div className="text-sm font-black">{invitation.guest.fullName}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="yellow">{invitation.guest.category.name}</Badge>
              <Badge>{invitation.status.replaceAll("_", " ")}</Badge>
            </div>
          </div>
          <RsvpForm defaultEmail={invitation.guest.email ?? ""} defaultPhone={invitation.guest.phone} token={token} />
        </div>
      </div>
    </main>
  );
}
