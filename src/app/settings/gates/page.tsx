import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { GateCreateForm } from "@/components/gate-create-form";
import { GateSettingsManager } from "@/components/gate-settings-manager";
import { PageHeader } from "@/components/page-header";
import { SettingsTabs } from "@/components/settings-tabs";
import { Card } from "@/components/ui";
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
          <GateSettingsManager initialGates={gates.map((gate) => ({ id: gate.id, name: gate.name, code: gate.code, description: gate.description ?? "", active: gate.active }))} />
        </Card>
      </div>
    </AppShell>
  );
}
