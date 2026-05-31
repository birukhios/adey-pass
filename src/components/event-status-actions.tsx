"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EventStatusActions({ eventId, currentStatus }: { eventId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(nextStatus: "ACTIVE" | "CLOSED" | "ARCHIVED") {
    setLoading(true);
    await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {currentStatus !== "Active" ? <button className="ap-button-ghost" disabled={loading} onClick={() => { void updateStatus("ACTIVE"); }} type="button">Activate</button> : null}
      {currentStatus !== "Closed" ? <button className="ap-button-ghost" disabled={loading} onClick={() => { void updateStatus("CLOSED"); }} type="button">Close</button> : null}
      {currentStatus !== "Archived" ? <button className="ap-button-ghost" disabled={loading} onClick={() => { void updateStatus("ARCHIVED"); }} type="button">Archive</button> : null}
    </div>
  );
}
