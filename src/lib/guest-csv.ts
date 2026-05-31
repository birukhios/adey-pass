import Papa from "papaparse";

export const guestCsvHeaders = [
  "full_name",
  "phone_number",
  "email",
  "category",
  "organization",
  "title_role",
  "event",
  "notes",
] as const;

export const guestCsvTemplate = `${guestCsvHeaders.join(",")}
Aster Girma,+251911111111,aster@example.com,VIP,Adey Group,Board Guest,Adey Launch Showcase,Needs protocol escort
Mikael Tadesse,+251922222222,mikael@example.com,Media,Addis Daily,Reporter,Adey Launch Showcase,Camera access
Liya Kebede,+251933333333,liya@example.com,Staff,Adey Ops,Operations Lead,Adey Launch Showcase,Backstage access
`;

export const allowedGuestCategories = [
  "VIP",
  "Media",
  "Staff",
  "Sponsor",
  "Protocol",
  "Security",
  "Vendor",
  "Emergency/Medical",
  "Special Guest",
];

export type GuestImportRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: string;
  organization: string;
  role: string;
  event: string;
  invitation: "Draft";
  registration: "Pending";
  ticket: "Not Generated";
  verification: "Not Started";
  checkin: "Not Checked In";
  notes: string;
};

export type ParsedGuestCsvRow = {
  rowNumber: number;
  data: GuestImportRow;
  errors: string[];
};

type RawCsvRow = Record<string, string | undefined>;

export const requiredGuestCsvHeaders = ["full_name", "phone_number", "category", "event"];

export function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replaceAll(" ", "_").replaceAll("-", "_");
}

function value(row: RawCsvRow, key: string) {
  return row[key]?.trim() ?? "";
}

export function toGuestImportRow(row: RawCsvRow, rowNumber: number): ParsedGuestCsvRow {
  const category = value(row, "category");
  const errors: string[] = [];

  if (!value(row, "full_name")) errors.push("Full name is required");
  if (!value(row, "phone_number")) errors.push("Phone number is required");
  if (!category) errors.push("Category is required");
  if (category && !allowedGuestCategories.includes(category)) errors.push(`Category must be one of: ${allowedGuestCategories.join(", ")}`);
  if (!value(row, "event")) errors.push("Event is required");

  return {
    rowNumber,
    errors,
    data: {
      id: `import-${rowNumber}-${value(row, "phone_number") || crypto.randomUUID()}`,
      name: value(row, "full_name"),
      phone: value(row, "phone_number"),
      email: value(row, "email"),
      category,
      organization: value(row, "organization"),
      role: value(row, "title_role"),
      event: value(row, "event"),
      notes: value(row, "notes"),
      invitation: "Draft",
      registration: "Pending",
      ticket: "Not Generated",
      verification: "Not Started",
      checkin: "Not Checked In",
    },
  };
}

export function parseGuestCsvText(csvText: string) {
  const result = Papa.parse<RawCsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  const headers = result.meta.fields ?? [];
  const missingHeaders = requiredGuestCsvHeaders.filter((header) => !headers.includes(header));

  return {
    missingHeaders,
    rows: missingHeaders.length ? [] : result.data.map((row, index) => toGuestImportRow(row, index + 2)),
    errors: result.errors,
  };
}

export function downloadGuestCsvTemplate() {
  const blob = new Blob([guestCsvTemplate], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "adey-pass-guest-import-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}
