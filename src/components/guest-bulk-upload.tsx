"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import Papa from "papaparse";
import { Ban, Check, Copy, Download, FileSpreadsheet, Plus, QrCode, Send, Trash2, Upload, X } from "lucide-react";
import { Badge, ButtonLink, Card } from "@/components/ui";
import {
  downloadGuestCsvTemplate,
  guestCsvHeaders,
  normalizeHeader,
  requiredGuestCsvHeaders,
  toGuestImportRow,
  type ParsedGuestCsvRow,
} from "@/lib/guest-csv";

type RawCsvRow = Record<string, string | undefined>;

type GuestRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: string;
  organization: string;
  role: string;
  event: string;
  invitation: string;
  registration: string;
  ticket: string;
  ticketId?: string;
  linkToken?: string;
  invitationToken?: string;
  source?: string;
  createdAt?: string;
  verification: string;
  checkin: string;
};

type Option = { id: string; name: string };
type TabKey = "invited" | "booked" | "bulk";

const importantCategories = new Set([
  "VIP",
  "Media",
  "Staff",
  "Sponsor",
  "Protocol",
  "Security",
  "Vendor",
  "Emergency/Medical",
  "Special Guest",
]);

export function GuestBulkUpload({
  categories,
  events,
  initialGuests,
}: {
  categories: Option[];
  events: Option[];
  initialGuests: GuestRow[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("invited");
  const [rows, setRows] = useState<ParsedGuestCsvRow[]>([]);
  const [importedRows, setImportedRows] = useState<GuestRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [message, setMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [ticketPreview, setTicketPreview] = useState<GuestRow | null>(null);
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [deletedGuestIds, setDeletedGuestIds] = useState<string[]>([]);
  const [guestOverrides, setGuestOverrides] = useState<Record<string, Partial<GuestRow>>>({});
  const [eventFilter, setEventFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [organizationFilter, setOrganizationFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [singleGuest, setSingleGuest] = useState({
    fullName: "",
    phone: "",
    email: "",
    eventId: events[0]?.id ?? "",
    categoryId: categories.find((category) => category.name === "VIP")?.id ?? categories[0]?.id ?? "",
    organization: "",
    title: "",
    notes: "",
    generateTicket: false,
  });
  const [singleLoading, setSingleLoading] = useState(false);

  const allGuests = useMemo(
    () =>
      [...importedRows, ...initialGuests]
        .filter((guest) => !deletedGuestIds.includes(guest.id))
        .map((guest) => ({ ...guest, ...(guestOverrides[guest.id] ?? {}) })),
    [deletedGuestIds, guestOverrides, importedRows, initialGuests],
  );
  const applyFilters = useCallback((guest: GuestRow) => {
    const byEvent = eventFilter === "All" || guest.event === eventFilter;
    const byCategory = categoryFilter === "All" || guest.category === categoryFilter;
    const byOrganization = organizationFilter === "All" || guest.organization === organizationFilter;
    const byStatus = statusFilter === "All" || [guest.invitation, guest.registration, guest.ticket, guest.verification].includes(statusFilter);
    return byEvent && byCategory && byOrganization && byStatus;
  }, [categoryFilter, eventFilter, organizationFilter, statusFilter]);
  const invitedGuests = useMemo(
    () => allGuests.filter((guest) => importantCategories.has(guest.category) && guest.source !== "Walk In").filter(applyFilters),
    [allGuests, applyFilters],
  );
  const bookedGuests = useMemo(
    () => allGuests.filter((guest) => guest.registration === "Registered" || guest.ticket !== "Not Generated" || guest.source === "Public Registration").filter(applyFilters),
    [allGuests, applyFilters],
  );
  const validRows = rows.filter((row) => row.errors.length === 0);
  const errorRows = rows.filter((row) => row.errors.length > 0);
  const organizationOptions = useMemo(
    () => Array.from(new Set(allGuests.map((guest) => guest.organization).filter(Boolean))).sort(),
    [allGuests],
  );
  const stats = [
    { label: "Important invites", value: invitedGuests.length },
    { label: "Accepted / booked", value: bookedGuests.length },
    { label: "RSVP links", value: allGuests.filter((guest) => guest.invitationToken).length },
    { label: "Pending replies", value: invitedGuests.filter((guest) => ["Draft", "Sent", "Opened"].includes(guest.invitation)).length },
  ];

  function showMessage(next: string) {
    setMessage(next);
    window.setTimeout(() => setMessage(""), 3500);
  }

  function clearUpload() {
    setRows([]);
    setFileName("");
    setParseError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function parseFile(file: File) {
    setFileName(file.name);
    setParseError("");
    setMessage("");

    Papa.parse<RawCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        const missingHeaders = requiredGuestCsvHeaders.filter((header) => !headers.includes(header));

        if (missingHeaders.length) {
          setRows([]);
          setParseError(`Missing required columns: ${missingHeaders.join(", ")}`);
          return;
        }

        setRows(result.data.map((row, index) => toGuestImportRow(row, index + 2)));
      },
      error: (error) => {
        setRows([]);
        setParseError(error.message);
      },
    });
  }

  async function importValidRows() {
    if (!validRows.length) return;
    setIsImporting(true);
    setMessage("");

    try {
      const response = await fetch("/api/guests/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests: validRows.map((row) => row.data) }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message ?? "Unable to import guests.");

      setImportedRows((currentRows) => [...(result.guests ?? []), ...currentRows]);
      clearUpload();
      setActiveTab("invited");
      showMessage(`${result.importedCount ?? validRows.length} important guests imported as draft invitations.`);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Unable to import guests.");
    } finally {
      setIsImporting(false);
    }
  }

  async function createSingleGuest() {
    setSingleLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(singleGuest),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Could not add guest.");
      setImportedRows((currentRows) => [result, ...currentRows]);
      setSingleGuest((current) => ({
        ...current,
        fullName: "",
        phone: "",
        email: "",
        organization: "",
        title: "",
        notes: "",
        generateTicket: false,
      }));
      setModalOpen(false);
      setActiveTab("invited");
      showMessage(result.invitationToken ? "Guest added. RSVP invitation link is ready." : "Guest added.");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Could not add guest.");
    } finally {
      setSingleLoading(false);
    }
  }

  async function copyTicketLink(guest: GuestRow) {
    if (!guest.linkToken) return;
    await navigator.clipboard.writeText(`${window.location.origin}/ticket/${guest.linkToken}`);
    showMessage(`Copied ticket link for ${guest.name}.`);
  }

  async function copyRsvpLink(guest: GuestRow) {
    if (!guest.invitationToken) return;
    await navigator.clipboard.writeText(`${window.location.origin}/rsvp/${guest.invitationToken}`);
    showMessage(`Copied RSVP link for ${guest.name}.`);
  }

  function toggleGuestSelection(guestId: string) {
    setSelectedGuestIds((current) =>
      current.includes(guestId) ? current.filter((id) => id !== guestId) : [...current, guestId],
    );
  }

  async function sendBulkInvitations() {
    const guestIds = selectedGuestIds.length ? selectedGuestIds : invitedGuests.map((guest) => guest.id);
    if (!guestIds.length) {
      showMessage("No invited guests selected.");
      return;
    }

    const response = await fetch("/api/guests/invitations/bulk-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestIds }),
    });
    const result = await response.json();
    if (!response.ok) {
      showMessage(result.message ?? "Could not prepare invitations.");
      return;
    }

    const links = result.links
      .map((link: { name: string; token: string }) => `${link.name}: ${window.location.origin}/rsvp/${link.token}`)
      .join("\n");
    await navigator.clipboard.writeText(links);
    setGuestOverrides((current) => ({
      ...current,
      ...Object.fromEntries(guestIds.map((id) => [id, { invitation: "Sent" }])),
    }));
    setSelectedGuestIds([]);
    showMessage(`${result.sentCount} invitation links marked sent and copied.`);
  }

  async function runBulkGuestAction(action: "BLOCK" | "DELETE") {
    if (!selectedGuestIds.length) {
      showMessage("Select at least one guest first.");
      return;
    }
    if (action === "DELETE" && !window.confirm(`Delete ${selectedGuestIds.length} selected guest(s)? This cannot be undone.`)) {
      return;
    }
    const response = await fetch("/api/guests/bulk-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestIds: selectedGuestIds, action }),
    });
    const result = await response.json();
    if (!response.ok) {
      showMessage(result.message ?? "Could not update selected guests.");
      return;
    }
    if (action === "DELETE") {
      setDeletedGuestIds((current) => [...new Set([...current, ...selectedGuestIds])]);
    } else {
      setGuestOverrides((current) => ({
        ...current,
        ...Object.fromEntries(
          selectedGuestIds.map((id) => [
            id,
            { invitation: "Cancelled", registration: "Rejected", ticket: "Blocked", checkin: "Rejected" },
          ]),
        ),
      }));
    }
    showMessage(`${result.count} selected guest(s) ${action === "DELETE" ? "deleted" : "blocked"}.`);
    setSelectedGuestIds([]);
  }

  return (
    <div className="grid gap-5">
      {modalOpen ? <button className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm" onClick={() => setModalOpen(false)} type="button" /> : null}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border p-5 shadow-[var(--shadow-soft)]" style={{ borderColor: "var(--stroke)", background: "var(--surface)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="ap-kicker">Single Invitation</p>
                <h2 className="mt-2 text-2xl font-black">Add Important Guest</h2>
                <p className="mt-2 text-sm font-semibold ap-soft-text">Create one VIP, protocol, media, staff, or special guest invitation.</p>
              </div>
              <button className="ap-button-ghost min-h-10 px-3" onClick={() => setModalOpen(false)} type="button"><X size={16} /></button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <GuestInput label="Full name" onChange={(value) => setSingleGuest((state) => ({ ...state, fullName: value }))} value={singleGuest.fullName} />
              <GuestInput label="Phone" onChange={(value) => setSingleGuest((state) => ({ ...state, phone: value }))} value={singleGuest.phone} />
              <GuestInput label="Email optional" onChange={(value) => setSingleGuest((state) => ({ ...state, email: value }))} value={singleGuest.email} />
              <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>
                Event
                <select className="ap-input" onChange={(event) => setSingleGuest((state) => ({ ...state, eventId: event.target.value }))} value={singleGuest.eventId}>
                  {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>
                Invitation category
                <select className="ap-input" onChange={(event) => setSingleGuest((state) => ({ ...state, categoryId: event.target.value }))} value={singleGuest.categoryId}>
                  {categories.filter((category) => category.name !== "Walk-In").map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <GuestInput label="Organization" onChange={(value) => setSingleGuest((state) => ({ ...state, organization: value }))} value={singleGuest.organization} />
              <GuestInput label="Title / role" onChange={(value) => setSingleGuest((state) => ({ ...state, title: value }))} value={singleGuest.title} />
              <label className="grid gap-2 text-sm font-black md:col-span-2" style={{ color: "var(--text-strong)" }}>
                Notes
                <textarea className="ap-input min-h-24 py-3" onChange={(event) => setSingleGuest((state) => ({ ...state, notes: event.target.value }))} value={singleGuest.notes} />
              </label>
              <label className="flex items-center gap-2 rounded-2xl border p-3 text-sm font-black md:col-span-2" style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)", color: "var(--text-strong)" }}>
                <input checked={singleGuest.generateTicket} onChange={(event) => setSingleGuest((state) => ({ ...state, generateTicket: event.target.checked }))} type="checkbox" />
                Generate ticket immediately instead of waiting for RSVP
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="ap-button-ghost" onClick={() => setModalOpen(false)} type="button">Cancel</button>
              <button className="ap-button-primary" disabled={singleLoading || !singleGuest.fullName.trim() || !singleGuest.phone.trim()} onClick={() => { void createSingleGuest(); }} type="button">
                {singleLoading ? "Adding..." : "Create Invitation"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {ticketPreview ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border p-4 shadow-[var(--shadow-soft)] sm:p-5" style={{ borderColor: "var(--stroke)", background: "var(--surface)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="ap-kicker">Ticket QR</p>
                <h2 className="mt-2 text-xl font-black sm:text-2xl">{ticketPreview.name}</h2>
                <p className="mt-1 text-sm font-semibold ap-soft-text">{ticketPreview.event} · {ticketPreview.category}</p>
              </div>
              <button className="ap-button-ghost min-h-10 px-3" onClick={() => setTicketPreview(null)} type="button"><X size={16} /></button>
            </div>
            <div className="mt-5 rounded-3xl p-5 text-center" style={{ background: "var(--surface-muted)" }}>
              {ticketPreview.linkToken ? (
                <div className="inline-flex rounded-2xl bg-white p-4">
                  <QRCode value={`${window.location.origin}/ticket/${ticketPreview.linkToken}`} size={190} />
                </div>
              ) : null}
              <div className="mt-4 text-lg font-black">{ticketPreview.ticketId || "No ticket generated"}</div>
              <div className="mt-1 text-sm font-semibold ap-soft-text">{ticketPreview.ticket}</div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button className="ap-button-ghost gap-2" onClick={() => { void copyTicketLink(ticketPreview); }} type="button"><Copy size={15} /> Copy Link</button>
              <ButtonLink href={ticketPreview.linkToken ? `/ticket/${ticketPreview.linkToken}` : "#"} variant="ghost">Open Ticket</ButtonLink>
            </div>
          </div>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="ap-kicker">Guest Invitation Desk</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">VIP, protocol and important guest access</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 ap-soft-text">
              Use this page to invite important people, send RSVP links in bulk, and review who booked or confirmed through a link.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="ap-button-primary w-full gap-2 sm:w-auto" onClick={() => setModalOpen(true)} type="button"><Plus size={16} /> Add Guest</button>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div className="rounded-2xl border p-4" key={stat.label} style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)" }}>
              <div className="text-3xl font-black">{stat.value}</div>
              <div className="mt-1 text-xs font-black uppercase ap-soft-text">{stat.label}</div>
            </div>
          ))}
        </div>
        {message ? <div className="mt-5 rounded-2xl border p-3 text-sm font-bold" style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)", color: "var(--text-strong)" }}>{message}</div> : null}
      </Card>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border p-2" style={{ borderColor: "var(--stroke)", background: "var(--surface)" }}>
        <TabButton active={activeTab === "invited"} label="Important Invitations" onClick={() => setActiveTab("invited")} />
        <TabButton active={activeTab === "booked"} label="Booked / Confirmed" onClick={() => setActiveTab("booked")} />
        <TabButton active={activeTab === "bulk"} label="Bulk Invite Upload" onClick={() => setActiveTab("bulk")} />
      </div>

      {activeTab !== "bulk" ? (
        <Card className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>
            Event
            <select className="ap-input" onChange={(event) => setEventFilter(event.target.value)} value={eventFilter}>
              <option>All</option>
              {events.map((event) => <option key={event.id}>{event.name}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>
            Invitation type
            <select className="ap-input" onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
              <option>All</option>
              {categories.filter((category) => category.name !== "Walk-In").map((category) => <option key={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>
            Organization
            <select className="ap-input" onChange={(event) => setOrganizationFilter(event.target.value)} value={organizationFilter}>
              <option>All</option>
              {organizationOptions.map((organization) => <option key={organization}>{organization}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>
            Status
            <select className="ap-input" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option>All</option>
              <option>Draft</option>
              <option>Sent</option>
              <option>Opened</option>
              <option>Accepted</option>
              <option>Registered</option>
              <option>Generated</option>
              <option>Verified</option>
              <option>Pending</option>
            </select>
          </label>
        </Card>
      ) : null}

      {activeTab === "invited" ? (
        <Card>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black">Important Invitation List</h2>
              <p className="mt-1 text-sm font-semibold ap-soft-text">VIPs, protocol, media, staff and other invite-only guests.</p>
            </div>
            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <button className="ap-button-ghost gap-2" onClick={() => setSelectedGuestIds(invitedGuests.map((guest) => guest.id))} type="button"><Check size={16} /> Select All</button>
              <button className="ap-button-ghost gap-2" onClick={() => { void runBulkGuestAction("BLOCK"); }} type="button"><Ban size={16} /> Block</button>
              <button className="ap-button-ghost gap-2" onClick={() => { void runBulkGuestAction("DELETE"); }} type="button"><Trash2 size={16} /> Delete</button>
              <button className="ap-button-primary gap-2" onClick={() => { void sendBulkInvitations(); }} type="button"><Send size={16} /> Send Bulk Invitations</button>
            </div>
          </div>
          <GuestTable
            guests={invitedGuests}
            onCopyRsvp={copyRsvpLink}
            onCopyTicket={copyTicketLink}
            onPreviewTicket={setTicketPreview}
            showRsvp
            onSelect={toggleGuestSelection}
            selectedGuestIds={selectedGuestIds}
          />
        </Card>
      ) : null}

      {activeTab === "booked" ? (
        <Card>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black">Booked / Confirmed People</h2>
              <p className="mt-1 text-sm font-semibold ap-soft-text">People who accepted an RSVP, booked from a link, or already have generated tickets.</p>
            </div>
            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <Badge tone="green">{bookedGuests.length} confirmed</Badge>
              <button className="ap-button-ghost gap-2" onClick={() => setSelectedGuestIds(bookedGuests.map((guest) => guest.id))} type="button"><Check size={16} /> Select All</button>
              <button className="ap-button-ghost gap-2" onClick={() => { void runBulkGuestAction("BLOCK"); }} type="button"><Ban size={16} /> Block</button>
              <button className="ap-button-ghost gap-2" onClick={() => { void runBulkGuestAction("DELETE"); }} type="button"><Trash2 size={16} /> Delete</button>
            </div>
          </div>
          <GuestTable guests={bookedGuests} onCopyRsvp={copyRsvpLink} onCopyTicket={copyTicketLink} onPreviewTicket={setTicketPreview} onSelect={toggleGuestSelection} selectedGuestIds={selectedGuestIds} />
        </Card>
      ) : null}

      {activeTab === "bulk" ? (
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black">Bulk Invitation Upload</h2>
              <p className="mt-2 text-sm font-semibold leading-6 ap-soft-text">
                Upload important guests only. Required columns: {requiredGuestCsvHeaders.join(", ")}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="ap-button-ghost items-center gap-2" onClick={downloadGuestCsvTemplate} type="button"><Download size={16} /> Template</button>
              <button className="ap-button-primary items-center gap-2" onClick={() => fileInputRef.current?.click()} type="button"><Upload size={16} /> Choose CSV</button>
            </div>
          </div>

          <input accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) parseFile(file); }} ref={fileInputRef} type="file" />
          <div className="mt-5 rounded-2xl border border-dashed p-4" style={{ borderColor: "var(--stroke-strong)", background: "var(--surface-muted)" }}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl" style={{ background: "color-mix(in oklab, var(--adey-yellow) 24%, var(--surface))", color: "var(--adey-yellow-deep)" }}><FileSpreadsheet size={20} /></div>
                <div>
                  <div className="text-sm font-black">{fileName || "No CSV selected"}</div>
                  <div className="text-xs font-bold ap-soft-text">Accepted headers: {guestCsvHeaders.join(", ")}</div>
                </div>
              </div>
              {(rows.length > 0 || parseError) ? <button className="ap-button-ghost min-h-10 items-center gap-2 px-3" onClick={clearUpload} type="button"><X size={16} /> Clear</button> : null}
            </div>
          </div>
          {parseError ? <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{parseError}</div> : null}
          {rows.length > 0 ? (
            <div className="mt-5">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="green">{validRows.length} valid</Badge>
                  <Badge tone={errorRows.length ? "red" : "neutral"}>{errorRows.length} with errors</Badge>
                </div>
                <button className="ap-button-primary disabled:cursor-not-allowed disabled:opacity-50" disabled={!validRows.length || isImporting} onClick={importValidRows} type="button">
                  {isImporting ? "Importing..." : "Import Draft Invitations"}
                </button>
              </div>
              <div className="ap-table-wrap">
                <table className="ap-table min-w-[960px]">
                  <thead><tr><th>Row</th><th>Guest</th><th>Category</th><th>Event</th><th>Organization</th><th>Issues</th></tr></thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={`${row.rowNumber}-${row.data.phone}`}>
                        <td className="font-black">{row.rowNumber}</td>
                        <td><div className="font-black">{row.data.name || "Missing name"}</div><div className="text-xs font-semibold ap-soft-text">{row.data.phone || "Missing phone"}</div></td>
                        <td><Badge tone={row.errors.length ? "neutral" : "yellow"}>{row.data.category || "Missing"}</Badge></td>
                        <td>{row.data.event || "Missing event"}</td>
                        <td>{row.data.organization || "-"}</td>
                        <td className="max-w-md">{row.errors.length ? <span className="font-bold text-red-700">{row.errors.join("; ")}</span> : <span className="font-bold text-emerald-700">Ready to import</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className="min-h-10 whitespace-nowrap rounded-xl px-4 text-sm font-black transition"
      onClick={onClick}
      style={active ? { background: "var(--adey-yellow)", color: "var(--adey-charcoal)" } : { color: "var(--text-muted)" }}
      type="button"
    >
      {label}
    </button>
  );
}

function GuestInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>
      {label}
      <input className="ap-input" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function GuestTable({
  guests,
  selectedGuestIds,
  onCopyRsvp,
  onCopyTicket,
  onPreviewTicket,
  onSelect,
  showRsvp = false,
}: {
  guests: GuestRow[];
  selectedGuestIds: string[];
  onCopyRsvp: (guest: GuestRow) => void | Promise<void>;
  onCopyTicket: (guest: GuestRow) => void | Promise<void>;
  onPreviewTicket: (guest: GuestRow) => void;
  onSelect?: (guestId: string) => void;
  showRsvp?: boolean;
}) {
  return (
    <>
    <div className="ap-mobile-list mt-5">
      {guests.map((guest) => (
        <article className="ap-mobile-card" key={guest.id}>
          <div className="flex items-start gap-3">
            <input checked={selectedGuestIds.includes(guest.id)} className="mt-1 size-4 shrink-0 accent-[var(--adey-yellow)]" onChange={() => onSelect?.(guest.id)} type="checkbox" />
            <div className="min-w-0 flex-1">
              <div className="break-words font-black">{guest.name}</div>
              <div className="mt-1 text-xs font-semibold ap-soft-text">{guest.phone}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={guest.category === "VIP" || guest.category === "Protocol" ? "yellow" : "neutral"}>{guest.category}</Badge>
                <Badge tone={["Accepted", "Sent", "Opened"].includes(guest.invitation) ? "green" : "neutral"}>{guest.invitation}</Badge>
              </div>
              <div className="mt-3 grid gap-1 text-sm font-semibold">
                <span>{guest.organization || "-"}</span>
                <span className="ap-soft-text">{guest.event}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {showRsvp && guest.invitationToken ? <button className="ap-button-ghost min-h-10 gap-1 px-3 text-xs" onClick={() => { void onCopyRsvp(guest); }} type="button"><Send size={13} /> RSVP</button> : null}
            {guest.linkToken ? <button className="ap-button-ghost min-h-10 gap-1 px-3 text-xs" onClick={() => onPreviewTicket(guest)} type="button"><QrCode size={13} /> Ticket</button> : null}
            {guest.linkToken ? <button className="ap-button-ghost min-h-10 gap-1 px-3 text-xs" onClick={() => { void onCopyTicket(guest); }} type="button"><Copy size={13} /> Copy</button> : null}
            <ButtonLink href={`/guests/${guest.id}`} variant="ghost">View</ButtonLink>
          </div>
        </article>
      ))}
      {!guests.length ? <div className="ap-mobile-card py-8 text-center text-sm font-bold ap-soft-text">No guests in this view yet.</div> : null}
    </div>
    <div className="ap-table-wrap ap-desktop-table mt-5">
      <table className="ap-table min-w-[1020px]">
        <thead>
          <tr>
            <th className="w-12">Select</th>
            <th>Guest</th>
            <th>Invitation Type</th>
            <th>Organization</th>
            <th>Event</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((guest) => (
            <tr key={guest.id}>
              <td>
                <input checked={selectedGuestIds.includes(guest.id)} className="size-4 accent-[var(--adey-yellow)]" onChange={() => onSelect?.(guest.id)} type="checkbox" />
              </td>
              <td>
                <div className="font-black">{guest.name}</div>
                <div className="text-xs font-semibold ap-soft-text">{guest.phone}</div>
              </td>
              <td><Badge tone={guest.category === "VIP" || guest.category === "Protocol" ? "yellow" : "neutral"}>{guest.category}</Badge></td>
              <td><div className="font-bold">{guest.organization || "-"}</div><div className="text-xs font-semibold ap-soft-text">{guest.role || "No title"}</div></td>
              <td>{guest.event}</td>
              <td>
                <div className="grid gap-1">
                  <Badge tone={["Accepted", "Sent", "Opened"].includes(guest.invitation) ? "green" : "neutral"}>{guest.invitation}</Badge>
                  <span className="text-xs font-bold ap-soft-text">{guest.registration}</span>
                </div>
              </td>
              <td>
                <div className="flex flex-wrap gap-2">
                  {showRsvp && guest.invitationToken ? <button className="ap-button-ghost min-h-9 gap-1 px-3 text-xs" onClick={() => { void onCopyRsvp(guest); }} type="button"><Send size={13} /> RSVP</button> : null}
                  {guest.linkToken ? <button className="ap-button-ghost min-h-9 gap-1 px-3 text-xs" onClick={() => onPreviewTicket(guest)} type="button"><QrCode size={13} /> Ticket</button> : null}
                  {guest.linkToken ? <button className="ap-button-ghost min-h-9 gap-1 px-3 text-xs" onClick={() => { void onCopyTicket(guest); }} type="button"><Copy size={13} /> Copy</button> : null}
                  <ButtonLink href={`/guests/${guest.id}`} variant="ghost">View</ButtonLink>
                </div>
              </td>
            </tr>
          ))}
          {!guests.length ? (
            <tr><td className="py-10 text-center text-sm font-bold ap-soft-text" colSpan={7}>No guests in this view yet.</td></tr>
          ) : null}
        </tbody>
      </table>
    </div>
    </>
  );
}
