export const ticketDesigns = [
  {
    key: "vvip-blue",
    name: "VVIP Blue Outline",
    accessType: "VVIP Access",
    primaryColor: "#0B7DE3",
    accentColor: "#075CAD",
    outlineColor: "#071B3D",
  },
  {
    key: "vip-gold",
    name: "VIP Gold Outline",
    accessType: "VIP Access",
    primaryColor: "#D6A600",
    accentColor: "#8A6A00",
    outlineColor: "#111418",
  },
  {
    key: "normal-silver",
    name: "Normal Silver Outline",
    accessType: "General Admission",
    primaryColor: "#94A3B8",
    accentColor: "#64748B",
    outlineColor: "#334155",
  },
  {
    key: "media-cyan",
    name: "Media Cyan Outline",
    accessType: "Media Access",
    primaryColor: "#38BDF8",
    accentColor: "#2563EB",
    outlineColor: "#0F172A",
  },
  {
    key: "staff-green",
    name: "Staff Green Outline",
    accessType: "Staff Access",
    primaryColor: "#22C55E",
    accentColor: "#166534",
    outlineColor: "#052E1A",
  },
];

export const ticketLayouts = [
  {
    key: "mobile-pass",
    name: "Mobile Pass",
    description: "Tall phone-first ticket with compact QR block.",
  },
  {
    key: "wide-ticket",
    name: "Wide Ticket",
    description: "Horizontal ticket layout for print and desktop preview.",
  },
  {
    key: "badge-card",
    name: "Badge Card",
    description: "Staff badge style with bold access label.",
  },
  {
    key: "minimal-qr",
    name: "Minimal QR",
    description: "Fast gate view with QR and essential identity only.",
  },
];

export function getTicketDesign(key: string) {
  return ticketDesigns.find((design) => design.key === key) ?? ticketDesigns[0];
}

export function getTicketLayout(key: string) {
  return ticketLayouts.find((layout) => layout.key === key) ?? ticketLayouts[0];
}
