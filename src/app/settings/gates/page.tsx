import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { GateCreateForm } from "@/components/gate-create-form";
import { PageHeader } from "@/components/page-header";
import { SettingsTabs } from "@/components/settings-tabs";
import { Badge, Card } from "@/components/ui";
import { getGatesList } from "@/lib/server-data";

export default async function GatesSettingsPage() {
  await connection();
  const gates = await getGatesList();
  return (
    <AppShell>
      <PageHeader title="Gate Settings" description="Define optional stadium or venue gates globally. Registration-only events may use or ignore gates." />
      <SettingsTabs />
      <div className="grid gap-4 xl:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] xl:gap-6">
        <Card>
          <h2 className="text-lg font-black">Add Gate</h2>
          <GateCreateForm />
        </Card>
        <Card className="min-w-0">
          <div className="ap-mobile-list">
            {gates.map((gate) => (
              <article className="ap-mobile-card" key={gate.code}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black">{gate.name}</div>
                    <div className="mt-1 text-xs font-bold ap-soft-text">{gate.code}</div>
                  </div>
                  <Badge tone={gate.active ? "green" : "neutral"}>{gate.active ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="mt-3 text-sm font-semibold ap-soft-text">{gate.description || "No description"}</p>
              </article>
            ))}
          </div>
          <div className="ap-desktop-table overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>
                <tr><th className="py-3">Gate</th><th>Code</th><th>Description</th><th>Status</th></tr>
              </thead>
              <tbody>
                {gates.map((gate) => (
                  <tr className="border-t" key={gate.code} style={{ borderColor: "var(--stroke)" }}>
                    <td className="py-3 font-black">{gate.name}</td>
                    <td>{gate.code}</td>
                    <td>{gate.description}</td>
                    <td><Badge tone={gate.active ? "green" : "neutral"}>{gate.active ? "Active" : "Inactive"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
