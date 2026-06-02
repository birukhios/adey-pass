import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { CameraScannerCard } from "@/components/camera-scanner-card";
import { ScannerPanel } from "@/components/scanner-panel";
import { WalkinRegistrationForm } from "@/components/walkin-registration-form";
import { Card } from "@/components/ui";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { permissions } from "@/lib/rbac";

export default async function ScannerPage() {
  await connection();
  const session = await getServerSession(authOptions);
  const userPermissions = session?.user?.permissions ?? [];
  const canManageWalkins = userPermissions.includes(permissions.walkinsCreate);

  const [events, assignedGates] = await Promise.all([
    prisma.event.findMany({
      where: { status: "ACTIVE" },
      orderBy: { date: "asc" },
      select: {
        id: true,
        name: true,
        ticketTypes: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            name: true,
            accessType: true,
            bookingToken: true,
            paymentRequired: true,
            priceAmount: true,
            currency: true,
          },
        },
      },
    }),
    session?.user?.id
      ? prisma.gate.findMany({
          where: {
            active: true,
            OR: [
              { officerAssignments: { some: { userId: session.user.id, active: true } } },
              { officerAssignments: { none: {} } },
            ],
          },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : [],
  ]);

  return (
    <AppShell>
      <div className="grid gap-4 sm:gap-5">
        <section className="overflow-hidden rounded-3xl border shadow-[var(--shadow-soft)] sm:rounded-[2rem]" style={{ borderColor: "color-mix(in oklab, white 10%, transparent)", background: "linear-gradient(145deg, #07122f, #172a67 58%, #2549bc)" }}>
          <div className="grid gap-4 p-3 sm:gap-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
            <div className="min-w-0">
              <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--adey-yellow)" }}>Gate console</div>
                  <h1 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">Scan, validate, check in</h1>
                </div>
                <a
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-black text-white transition hover:-translate-y-0.5 sm:w-auto"
                  href="#walkin-registration"
                  style={{ borderColor: "color-mix(in oklab, white 18%, transparent)", background: "color-mix(in oklab, white 7%, transparent)" }}
                >
                  Walk-in
                </a>
              </div>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/55">
                Point the camera at a QR code. Valid tickets check in immediately, duplicates are blocked, and manual entry is available when the camera cannot read.
              </p>
              <div className="mt-5">
                <CameraScannerCard gates={assignedGates} />
              </div>
            </div>
            <aside className="grid min-w-0 content-start gap-4">
              <ScannerPanel gates={assignedGates} />
              <div className="rounded-[1.75rem] border p-5" style={{ borderColor: "color-mix(in oklab, white 12%, transparent)", background: "color-mix(in oklab, white 7%, transparent)" }}>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-white/45">Gate rules</div>
                <div className="mt-4 grid gap-3 text-sm font-semibold text-white/68">
                  <p><span className="font-black text-white">Green:</span> valid ticket checked in.</p>
                  <p><span className="font-black text-white">Orange:</span> duplicate or verification needed.</p>
                  <p><span className="font-black text-white">Red:</span> cancelled, wrong gate, or not found.</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <Card className="scroll-mt-20 text-white" id="walkin-registration" style={{ background: "linear-gradient(145deg, #07122f, #172a67 58%, #2549bc)" }}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--adey-yellow)" }}>Walk-in desk</div>
              <h2 className="mt-1 text-2xl font-black">Register walk-in guest</h2>
            </div>
          </div>
          {canManageWalkins && events.length ? (
            <WalkinRegistrationForm events={events} />
          ) : canManageWalkins ? (
            <div className="rounded-3xl border p-5 text-sm font-semibold text-white/65" style={{ borderColor: "color-mix(in oklab, white 12%, transparent)", background: "color-mix(in oklab, white 7%, transparent)" }}>
              Create or activate an event before registering walk-in guests.
            </div>
          ) : (
            <div className="rounded-3xl border p-5 text-sm font-semibold text-white/65" style={{ borderColor: "color-mix(in oklab, white 12%, transparent)", background: "color-mix(in oklab, white 7%, transparent)" }}>
              This account has scanner-only access. Walk-in registration is disabled.
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
