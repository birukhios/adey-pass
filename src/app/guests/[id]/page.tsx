import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { GuestDetailActions } from "@/components/guest-detail-actions";
import { PageHeader } from "@/components/page-header";
import { Badge, Card } from "@/components/ui";
import { getGuestDetail } from "@/lib/server-data";

type Props = { params: Promise<{ id: string }> };

export default async function GuestDetailPage({ params }: Props) {
  await connection();
  const { id } = await params;
  const guest = await getGuestDetail(id);
  if (!guest) {
    return (
      <AppShell>
        <PageHeader title="Guest not found" description="The requested guest does not exist." />
      </AppShell>
    );
  }
  return (
    <AppShell>
      <PageHeader title={guest.fullName} description="Guest profile, invitation, ticket, verification, check-in history, and audit trail." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <GuestDetailActions
            guestId={guest.id}
            initial={{
              fullName: guest.fullName,
              phone: guest.phone,
              email: guest.email ?? "",
              organization: guest.organization ?? "",
              title: guest.title ?? "",
              notes: guest.notes ?? "",
            }}
          />
        </Card>
        <div className="grid gap-6">
          <Card>
            <h2 className="text-lg font-black">Fayda / National ID</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={guest.idVerification?.status === "VERIFIED" || guest.idVerification?.status === "MANUALLY_APPROVED" ? "green" : "yellow"}>
                {guest.idVerification?.status?.replaceAll("_", " ") ?? "NOT STARTED"}
              </Badge>
              <Badge>{guest.idVerification?.maskedIdNumber ?? "XXXX-XXXX-0000"}</Badge>
            </div>
            <dl className="mt-5 grid gap-3 text-sm">
              <div>
                <dt className="font-bold text-slate-500 dark:text-slate-400">Verification name</dt>
                <dd className="font-black">{guest.idVerification?.fullName ?? "Not submitted"}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500 dark:text-slate-400">Verification phone</dt>
                <dd className="font-black">{guest.idVerification?.phone ?? "Not submitted"}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500 dark:text-slate-400">Email</dt>
                <dd className="font-black">{guest.idVerification?.email ?? "Not submitted"}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500 dark:text-slate-400">Date of birth</dt>
                <dd className="font-black">{guest.idVerification?.dateOfBirth ? guest.idVerification.dateOfBirth.toLocaleDateString() : "Not submitted"}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500 dark:text-slate-400">Gender</dt>
                <dd className="font-black">{guest.idVerification?.gender ?? "Not submitted"}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500 dark:text-slate-400">Nationality</dt>
                <dd className="font-black">{guest.idVerification?.nationality ?? "Not submitted"}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500 dark:text-slate-400">Current address</dt>
                <dd className="font-black">{guest.idVerification?.currentAddress ?? "Not submitted"}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500 dark:text-slate-400">Method</dt>
                <dd className="font-black">{guest.idVerification?.method?.replaceAll("_", " ") ?? "Not started"}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500 dark:text-slate-400">Consent</dt>
                <dd className="font-black">{guest.idVerification?.consentGiven ? "Given" : "Not given"}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500 dark:text-slate-400">Verified at</dt>
                <dd className="font-black">{guest.idVerification?.verifiedAt ? guest.idVerification.verifiedAt.toLocaleString() : "Not verified"}</dd>
              </div>
              {guest.idVerification?.rejectedReason ? (
                <div>
                  <dt className="font-bold text-slate-500 dark:text-slate-400">Rejection reason</dt>
                  <dd className="font-black">{guest.idVerification.rejectedReason}</dd>
                </div>
              ) : null}
            </dl>
          </Card>
          <Card><h2 className="text-lg font-black">Ticket</h2><dl className="mt-3 grid gap-3 text-sm"><div><dt className="font-bold text-slate-500">Ticket ID</dt><dd className="font-black">{guest.ticket?.ticketId ?? "Not generated"}</dd></div><div><dt className="font-bold text-slate-500">Status</dt><dd><Badge tone="yellow">{guest.ticket?.status?.replaceAll("_", " ") ?? "NOT GENERATED"}</Badge></dd></div></dl></Card>
          <Card><h2 className="text-lg font-black">Audit Trail</h2><p className="mt-2 text-sm font-medium text-slate-600">Verification created, ticket generated, invitation sent.</p></Card>
        </div>
      </div>
    </AppShell>
  );
}
