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
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <h2 className="text-lg font-black">Add Gate</h2>
          <GateCreateForm />
        </Card>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr><th className="py-3">Gate</th><th>Code</th><th>Description</th><th>Status</th></tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {gates.map((gate) => (
                  <tr key={gate.code}>
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
