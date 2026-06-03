"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, Clock3, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui";

type ScanTicket = {
  guest: { fullName: string; category: { name: string }; idVerification: { status: string } | null };
  event: { name: string };
  gate: { name: string } | null;
  usedAt?: string | null;
};

export function CameraScannerCard({ gates }: { gates: Array<{ id: string; name: string }> }) {
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void | Promise<void> } | null>(null);
  const processingRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Camera is ready.");
  const [result, setResult] = useState<ScanTicket | null>(null);
  const [flash, setFlash] = useState<"none" | "valid" | "invalid" | "warning">("none");
  const [statusText, setStatusText] = useState("");
  const [gateId, setGateId] = useState(gates[0]?.id ?? "");

  const tone =
    statusText === "Allow Entry"
      ? "valid"
      : statusText === "Already Checked In" || statusText === "Verification Required"
        ? "warning"
        : statusText
          ? "invalid"
          : "idle";
  const StatusIcon = tone === "valid" ? CheckCircle2 : tone === "warning" ? AlertTriangle : tone === "invalid" ? ShieldX : Clock3;
  const resultTitle = statusText === "Allow Entry" ? "CHECKED IN" : statusText || "Ready to scan";
  const resultCopy =
    statusText === "Allow Entry"
      ? "Guest is cleared for entry."
      : statusText === "Already Checked In"
        ? `Already scanned${result?.usedAt ? ` at ${new Date(result.usedAt).toLocaleTimeString()}` : "."}`
        : statusText === "Verification Required"
          ? "Fayda verification must be completed before entry."
          : statusText || message;

  function triggerFlash(next: "valid" | "invalid" | "warning") {
    setFlash(next);
    setTimeout(() => setFlash("none"), 550);
  }

  async function stopScanner() {
    if (!scannerRef.current) return;
    const currentScanner = scannerRef.current;
    scannerRef.current = null;
    try {
      await Promise.race([
        (async () => {
          await currentScanner.stop();
          await currentScanner.clear();
        })(),
        new Promise<void>((resolve) => window.setTimeout(resolve, 2000)),
      ]);
    } catch {
      // Ignore teardown errors while switching state.
    } finally {
      setRunning(false);
    }
  }

  async function handleScan(decodedText: string) {
    if (processingRef.current) return;
    processingRef.current = true;
    setBusy(true);
    setMessage("Processing ticket...");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch("/api/scanner/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: decodedText, gateId: gateId || undefined }),
        signal: controller.signal,
      });
      const text = await response.text();
      const data = parseScannerResponse(text);
      setResult(data.ticket ?? null);
      setMessage(data.status ?? data.message ?? "Scan completed.");
      setStatusText(data.status ?? data.message ?? "Scan completed.");
      if (response.ok || data.status === "Allow Entry") triggerFlash("valid");
      else if (data.status === "Already Checked In" || data.status === "Verification Required") triggerFlash("warning");
      else triggerFlash("invalid");
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      setResult(null);
      setStatusText(timedOut ? "Scanner Timeout" : "Scanner Error");
      setMessage(timedOut ? "The scan request timed out. Try manual entry or scan again." : "Could not process this QR. Try manual entry.");
      triggerFlash("invalid");
    } finally {
      window.clearTimeout(timeout);
      processingRef.current = false;
      setBusy(false);
      await stopScanner();
    }
  }

  async function startScanner() {
    if (running) return;
    setMessage("Starting camera...");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) {
        setMessage("No camera found on this device.");
        return;
      }

      const html5 = new Html5Qrcode("adey-camera-scanner");
      const qrSize = Math.min(280, Math.max(190, Math.floor(window.innerWidth * 0.62)));
      scannerRef.current = html5;
      await html5.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: qrSize, height: qrSize } },
        (decodedText) => {
          void handleScan(decodedText);
        },
        () => {
          // Ignore per-frame decode misses.
        },
      );

      setRunning(true);
      setMessage("Camera scanning started. Point at QR code.");
    } catch {
      setMessage("Could not access camera. Check browser camera permission.");
    }
  }

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em]" style={{ color: "color-mix(in oklab, white 72%, transparent)" }}>
          Active gate
          <select className="ap-input" onChange={(event) => setGateId(event.target.value)} value={gateId}>
            <option value="">Any gate</option>
            {gates.map((gate) => <option key={gate.id} value={gate.id}>{gate.name}</option>)}
          </select>
        </label>
        <div className="rounded-2xl border p-3" style={{ borderColor: "color-mix(in oklab, white 14%, transparent)", background: "color-mix(in oklab, white 7%, transparent)" }}>
          <div className="text-xs font-black uppercase tracking-[0.14em] text-white/50">Scanner state</div>
          <div className="mt-2 flex items-center gap-2 text-sm font-black text-white">
            <span className={running ? "badge-live size-2 rounded-full" : "size-2 rounded-full"} style={{ background: running ? "var(--ok)" : "var(--text-soft)" }} />
            {running ? "Camera live" : busy ? "Processing" : "Standby"}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.5rem] border p-2.5 sm:rounded-[1.75rem] sm:p-3" style={{ borderColor: "color-mix(in oklab, white 12%, transparent)", background: "linear-gradient(180deg, color-mix(in oklab, white 8%, transparent), color-mix(in oklab, black 18%, transparent))" }}>
        <div className="relative h-[min(58vh,430px)] min-h-[260px] overflow-hidden rounded-[1.15rem] bg-black/35 sm:min-h-[340px]">
          <div id="adey-camera-scanner" className="h-full min-h-full rounded-[1.15rem] bg-black/35 [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover" />
          {!running ? (
            <div className="absolute inset-0 grid place-items-center px-5 text-center">
              <div className="max-w-xs">
                <div className="mx-auto grid size-14 place-items-center rounded-full sm:size-16" style={{ background: "color-mix(in oklab, var(--adey-yellow) 18%, transparent)", color: "var(--adey-yellow)" }}>
                  <Camera className="size-6 sm:size-7" />
                </div>
                <div className="mt-4 text-lg font-black text-white sm:text-xl">Camera scanner ready</div>
                <p className="mt-2 max-w-xs text-sm font-semibold text-white/55">Start the scanner and hold the QR code inside the yellow frame.</p>
              </div>
            </div>
          ) : null}
          <div className="pointer-events-none absolute inset-4 sm:inset-5">
            <div className="scan-frame-corner absolute left-0 top-0 h-10 w-10 rounded-tl-2xl border-l-4 border-t-4 border-[var(--adey-yellow)] sm:h-12 sm:w-12" />
            <div className="scan-frame-corner absolute right-0 top-0 h-10 w-10 rounded-tr-2xl border-r-4 border-t-4 border-[var(--adey-yellow)] sm:h-12 sm:w-12" />
            <div className="scan-frame-corner absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-[var(--adey-yellow)] sm:h-12 sm:w-12" />
            <div className="scan-frame-corner absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-[var(--adey-yellow)] sm:h-12 sm:w-12" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button className="ap-button-primary inline-flex min-w-0 items-center gap-2 disabled:opacity-60 sm:flex-none" disabled={running || busy} onClick={() => { void startScanner(); }} type="button">
            <Camera size={16} />
            {busy ? "Processing..." : "Start scan"}
          </button>
          <button className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black text-white transition disabled:opacity-60 sm:flex-none" disabled={!running} onClick={() => { void stopScanner(); setMessage("Camera stopped."); }} style={{ borderColor: "color-mix(in oklab, white 18%, transparent)", background: "color-mix(in oklab, white 8%, transparent)" }} type="button">
            <CameraOff size={16} />
            Stop
          </button>
        </div>
      </div>
      {flash !== "none" ? (
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{
            background:
              flash === "valid"
                ? "color-mix(in oklab, var(--ok) 24%, transparent)"
                : flash === "warning"
                  ? "color-mix(in oklab, var(--warn) 26%, transparent)"
                  : "color-mix(in oklab, var(--danger) 24%, transparent)",
          }}
        />
      ) : null}
      <div className="min-w-0 rounded-[1.5rem] border p-4" style={{ borderColor: "color-mix(in oklab, white 12%, transparent)", background: tone === "valid" ? "color-mix(in oklab, var(--ok) 18%, transparent)" : tone === "warning" ? "color-mix(in oklab, var(--warn) 18%, transparent)" : tone === "invalid" ? "color-mix(in oklab, var(--danger) 16%, transparent)" : "color-mix(in oklab, white 7%, transparent)" }}>
        <div className="flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl" style={{ background: "color-mix(in oklab, white 12%, transparent)", color: tone === "valid" ? "var(--ok)" : tone === "warning" ? "var(--warn)" : tone === "invalid" ? "var(--danger)" : "var(--adey-yellow)" }}>
            <StatusIcon size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-white/50">Latest result</div>
            <div className="mt-1 break-words text-xl font-black text-white sm:text-2xl">{resultTitle}</div>
            <p className="mt-1 text-sm font-semibold text-white/70">{resultCopy}</p>
          </div>
        </div>
        {result ? (
          <div className="mt-4 min-w-0 rounded-2xl p-4" style={{ background: "color-mix(in oklab, black 18%, transparent)" }}>
            <div className="break-words text-lg font-black text-white sm:text-xl">{result.guest.fullName}</div>
            <div className="mt-1 text-sm font-semibold text-white/65">{result.event.name} · {result.gate?.name ?? "Any Gate"}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="yellow">{result.guest.category.name}</Badge>
              <Badge tone={["VERIFIED", "MANUALLY_APPROVED"].includes(result.guest.idVerification?.status ?? "") ? "green" : "yellow"}>
                {result.guest.idVerification?.status?.replaceAll("_", " ") ?? "NOT STARTED"}
              </Badge>
              {statusText === "Already Checked In" ? (
                <Badge tone="yellow">First scan: {result.usedAt ? new Date(result.usedAt).toLocaleTimeString() : "Previously scanned"}</Badge>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function parseScannerResponse(text: string) {
  try {
    return JSON.parse(text) as { status?: string; message?: string; ticket?: ScanTicket };
  } catch {
    return { message: "Scanner returned an unreadable response. Please sign in again or use manual entry." };
  }
}
