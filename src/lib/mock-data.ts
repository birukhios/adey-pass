import {
  BadgeCheck,
  CalendarDays,
  ContactRound,
  DoorOpen,
  FileBarChart,
  LayoutDashboard,
  QrCode,
  Settings,
  Ticket,
  UserRoundCog,
  UsersRound,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
  { href: "/events", label: "Events", icon: CalendarDays, permission: "events:manage" },
  { href: "/guests", label: "Guests", icon: UsersRound, permission: "guests:manage" },
  { href: "/tickets", label: "Tickets", icon: Ticket, permission: "tickets:manage" },
  { href: "/scanner", label: "Scanner", icon: QrCode, permission: "scanner:use" },
  { href: "/reports", label: "Reports", icon: FileBarChart, permission: "reports:view" },
  { href: "/settings/profile", label: "Settings", icon: Settings, permission: "settings:manage" },
];

export const settingsItems = [
  { href: "/settings/profile", label: "Profile", icon: ContactRound },
  { href: "/settings/users", label: "Users & Roles", icon: UserRoundCog },
  { href: "/settings/gates", label: "Gates", icon: DoorOpen },
  { href: "/settings/branding", label: "Branding", icon: BadgeCheck },
];

export const events = [
  {
    id: "event-launch",
    name: "Adey Launch Showcase",
    date: "Jun 20, 2026",
    time: "6:00 PM - 10:00 PM",
    venue: "National Stadium",
    status: "Active",
    registered: 1284,
    checkedIn: 839,
    gates: ["Main Gate", "VIP Gate", "Media Gate", "Staff Gate"],
    verification: true,
    walkins: true,
  },
  {
    id: "event-media-night",
    name: "Media Preview Night",
    date: "Jul 04, 2026",
    time: "5:30 PM - 8:30 PM",
    venue: "Unity Pavilion",
    status: "Draft",
    registered: 184,
    checkedIn: 0,
    gates: [],
    verification: true,
    walkins: false,
  },
];

export const guests = [
  {
    id: "guest-aster",
    name: "Aster Girma",
    phone: "+251 911 111 111",
    email: "aster@example.com",
    category: "VIP",
    organization: "Adey Group",
    role: "Board Guest",
    event: "Adey Launch Showcase",
    invitation: "Sent",
    registration: "Registered",
    ticket: "Generated",
    verification: "Verified",
    checkin: "Not Checked In",
  },
  {
    id: "guest-mikael",
    name: "Mikael Tadesse",
    phone: "+251 922 222 222",
    email: "mikael@example.com",
    category: "Media",
    organization: "Addis Daily",
    role: "Reporter",
    event: "Adey Launch Showcase",
    invitation: "Opened",
    registration: "Registered",
    ticket: "Sent",
    verification: "Pending",
    checkin: "Not Checked In",
  },
  {
    id: "guest-liya",
    name: "Liya Kebede",
    phone: "+251 933 333 333",
    email: "liya@example.com",
    category: "Staff",
    organization: "Adey Ops",
    role: "Operations Lead",
    event: "Adey Launch Showcase",
    invitation: "Accepted",
    registration: "Registered",
    ticket: "Used",
    verification: "Manually Approved",
    checkin: "Checked In",
  },
  {
    id: "guest-abel",
    name: "Abel Fikru",
    phone: "+251 944 444 444",
    email: "",
    category: "Walk-In",
    organization: "",
    role: "",
    event: "Adey Launch Showcase",
    invitation: "Accepted",
    registration: "Registered",
    ticket: "Generated",
    verification: "Not Started",
    checkin: "Not Checked In",
  },
];

export const gates = [
  { name: "Main Gate", code: "MAIN", active: true, description: "Primary guest entry" },
  { name: "VIP Gate", code: "VIP", active: true, description: "VIP and protocol access" },
  { name: "Media Gate", code: "MEDIA", active: true, description: "Press and media access" },
  { name: "Staff Gate", code: "STAFF", active: true, description: "Operations and staff access" },
  { name: "Emergency Gate", code: "EMERG", active: false, description: "Emergency and medical access" },
];

export const metrics = [
  { label: "Total Events", value: "2", delta: "+1 draft" },
  { label: "Registered Users", value: "1,284", delta: "+14.5%" },
  { label: "Invited Guests", value: "918", delta: "+86 today" },
  { label: "VIP Guests", value: "126", delta: "42 checked" },
  { label: "Media Guests", value: "74", delta: "18 pending" },
  { label: "Staff Guests", value: "203", delta: "91 checked" },
  { label: "Tickets Generated", value: "1,210", delta: "+12.6%" },
  { label: "Checked In", value: "839", delta: "+9.2%" },
  { label: "Walk-In Guests", value: "47", delta: "+12 today" },
  { label: "Pending ID Verification", value: "64", delta: "needs review" },
  { label: "Failed Verification", value: "9", delta: "manual action" },
  { label: "No-Shows", value: "398", delta: "projected" },
];

export const trendData = [
  { day: "May 25", registrations: 240, checkins: 120 },
  { day: "May 26", registrations: 390, checkins: 180 },
  { day: "May 27", registrations: 310, checkins: 260 },
  { day: "May 28", registrations: 330, checkins: 420 },
  { day: "May 29", registrations: 460, checkins: 610 },
  { day: "May 30", registrations: 520, checkins: 839 },
];

export const categoryData = [
  { name: "VIP", value: 126 },
  { name: "Media", value: 74 },
  { name: "Staff", value: 203 },
  { name: "Special", value: 91 },
  { name: "Walk-In", value: 47 },
];
