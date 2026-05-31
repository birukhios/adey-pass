import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskNationalId(value: string) {
  const digits = value.replace(/\D/g, "");
  const lastFour = digits.slice(-4).padStart(4, "X");
  return `XXXX-XXXX-${lastFour}`;
}

export function ticketUrl(token: string) {
  return `/ticket/${token}`;
}
