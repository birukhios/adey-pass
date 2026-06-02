"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Save, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui";

type GateRow = {
  id: string;
  name: string;
  code: string;
  description: string;
  active: boolean;
};

export function GateSettingsManager({ initialGates }: { initialGates: GateRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GateRow | null>(null);
  const [message, setMessage] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function startEdit(gate: GateRow) {
    setEditingId(gate.id);
    setDraft(gate);
    setMessage("");
  }

  async function saveGate() {
    if (!draft) return;
    setLoadingId(draft.id);
    setMessage("");
    const response = await fetch(`/api/gates/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const result = await response.json();
    setLoadingId(null);
    if (!response.ok) {
      setMessage(result.message ?? "Could not update gate.");
      return;
    }
    setEditingId(null);
    setDraft(null);
    setMessage("Gate updated.");
    router.refresh();
  }

  async function deleteGate(gate: GateRow) {
    const confirmed = window.confirm(`Delete ${gate.name}? If the gate has history, it will be deactivated instead.`);
    if (!confirmed) return;
    setLoadingId(gate.id);
    setMessage("");
    const response = await fetch(`/api/gates/${gate.id}`, { method: "DELETE" });
    const result = await response.json();
    setLoadingId(null);
    if (!response.ok) {
      setMessage(result.message ?? "Could not delete gate.");
      return;
    }
    setMessage(result.archived ? "Gate has history, so it was deactivated." : "Gate deleted.");
    router.refresh();
  }

  function updateDraft(next: Partial<GateRow>) {
    setDraft((current) => current ? { ...current, ...next } : current);
  }

  return (
    <div className="min-w-0">
      {message ? <div className="mb-4 rounded-2xl border p-3 text-sm font-bold" style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)", color: "var(--text-strong)" }}>{message}</div> : null}
      <div className="ap-mobile-list">
        {initialGates.map((gate) => {
          const isEditing = editingId === gate.id && draft;
          return (
            <article className="ap-mobile-card" key={gate.id}>
              {isEditing ? (
                <GateEditFields draft={draft} onChange={updateDraft} />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black">{gate.name}</div>
                      <div className="mt-1 text-xs font-bold ap-soft-text">{gate.code}</div>
                    </div>
                    <Badge tone={gate.active ? "green" : "neutral"}>{gate.active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="mt-3 text-sm font-semibold ap-soft-text">{gate.description || "No description"}</p>
                </>
              )}
              <GateActions
                isEditing={Boolean(isEditing)}
                loading={loadingId === gate.id}
                onCancel={() => { setEditingId(null); setDraft(null); }}
                onDelete={() => { void deleteGate(gate); }}
                onEdit={() => startEdit(gate)}
                onSave={() => { void saveGate(); }}
              />
            </article>
          );
        })}
      </div>
      <div className="ap-desktop-table overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>
            <tr><th className="py-3">Gate</th><th>Code</th><th>Description</th><th>Status</th><th className="w-44">Actions</th></tr>
          </thead>
          <tbody>
            {initialGates.map((gate) => {
              const isEditing = editingId === gate.id && draft;
              return (
                <tr className="border-t align-top" key={gate.id} style={{ borderColor: "var(--stroke)" }}>
                  {isEditing ? (
                    <>
                      <td className="py-3"><input className="ap-input" onChange={(event) => updateDraft({ name: event.target.value })} value={draft.name} /></td>
                      <td className="py-3"><input className="ap-input" onChange={(event) => updateDraft({ code: event.target.value })} value={draft.code} /></td>
                      <td className="py-3"><input className="ap-input" onChange={(event) => updateDraft({ description: event.target.value })} value={draft.description} /></td>
                      <td className="py-3">
                        <select className="ap-input" onChange={(event) => updateDraft({ active: event.target.value === "active" })} value={draft.active ? "active" : "inactive"}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 font-black">{gate.name}</td>
                      <td>{gate.code}</td>
                      <td>{gate.description || "No description"}</td>
                      <td><Badge tone={gate.active ? "green" : "neutral"}>{gate.active ? "Active" : "Inactive"}</Badge></td>
                    </>
                  )}
                  <td className="py-3">
                    <GateActions
                      isEditing={Boolean(isEditing)}
                      loading={loadingId === gate.id}
                      onCancel={() => { setEditingId(null); setDraft(null); }}
                      onDelete={() => { void deleteGate(gate); }}
                      onEdit={() => startEdit(gate)}
                      onSave={() => { void saveGate(); }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GateEditFields({ draft, onChange }: { draft: GateRow; onChange: (next: Partial<GateRow>) => void }) {
  return (
    <div className="grid gap-3">
      <label className="ap-field-label">Gate name<input className="ap-input" onChange={(event) => onChange({ name: event.target.value })} value={draft.name} /></label>
      <label className="ap-field-label">Gate code<input className="ap-input" onChange={(event) => onChange({ code: event.target.value })} value={draft.code} /></label>
      <label className="ap-field-label">Description<input className="ap-input" onChange={(event) => onChange({ description: event.target.value })} value={draft.description} /></label>
      <label className="ap-field-label">Status<select className="ap-input" onChange={(event) => onChange({ active: event.target.value === "active" })} value={draft.active ? "active" : "inactive"}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
    </div>
  );
}

function GateActions({ isEditing, loading, onCancel, onDelete, onEdit, onSave }: { isEditing: boolean; loading: boolean; onCancel: () => void; onDelete: () => void; onEdit: () => void; onSave: () => void }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
      {isEditing ? (
        <>
          <button className="ap-button-primary min-h-9 gap-2 px-3" disabled={loading} onClick={onSave} type="button"><Save size={15} /> Save</button>
          <button className="ap-button-ghost min-h-9 gap-2 px-3" disabled={loading} onClick={onCancel} type="button"><X size={15} /> Cancel</button>
        </>
      ) : (
        <>
          <button className="ap-button-ghost min-h-9 gap-2 px-3" disabled={loading} onClick={onEdit} type="button"><Edit3 size={15} /> Edit</button>
          <button className="ap-button-ghost min-h-9 gap-2 px-3 text-red-600" disabled={loading} onClick={onDelete} type="button"><Trash2 size={15} /> Delete</button>
        </>
      )}
    </div>
  );
}
