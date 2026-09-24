import { format, parseISO, getDay } from "date-fns";
import type { DayKey, PayMethod, AttendanceStatus } from "./types.ts";

export const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function dateISO(d = new Date()): string {
  return format(d, "yyyy-MM-dd");
}

export function monthISO(d = new Date()): string {
  return format(d, "yyyy-MM");
}

export function prettyDate(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}

export function prettyMonth(ym: string): string {
  try {
    return format(parseISO(`${ym}-01`), "MMMM yyyy");
  } catch {
    return ym;
  }
}

export function dayKeyFromISO(iso: string): DayKey {
  const d = getDay(parseISO(iso));
  return DAY_KEYS[d] ?? "sun";
}

export function money(n: number, lang: "en" | "bn" = "en"): string {
  const formatted = Math.round(n).toLocaleString("en-IN");
  return lang === "bn" ? `৳${toBnDigits(formatted)}` : `৳${formatted}`;
}

export function toBnDigits(s: string): string {
  const map = "০১২৩৪৫৬৭৮৯";
  return s.replace(/\d/g, (d) => map[Number(d)] ?? d);
}

export function hmToPretty(hm: string): string {
  const [hStr, m] = hm.split(":");
  const h = Number(hStr);
  const am = h < 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${am ? "AM" : "PM"}`;
}

export const DAY_EN: Record<DayKey, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

export const DAY_BN: Record<DayKey, string> = {
  sun: "রবিবার",
  mon: "সোমবার",
  tue: "মঙ্গলবার",
  wed: "বুধবার",
  thu: "বৃহস্পতিবার",
  fri: "শুক্রবার",
  sat: "শনিবার",
};

export const METHOD_EN: Record<PayMethod, string> = {
  cash: "Cash",
  bkash: "bKash",
  nagad: "Nagad",
  bank: "Bank",
  card: "Card",
  other: "Other",
};

export const METHOD_BN: Record<PayMethod, string> = {
  cash: "নগদ",
  bkash: "বিকাশ",
  nagad: "নগদ",
  bank: "ব্যাংক",
  card: "কার্ড",
  other: "অন্যান্য",
};

export const ATT_EN: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
  left_early: "Left early",
  not_enrolled: "Not enrolled",
};

export function hueColor(hue: number): string {
  return `hsl(${hue} 28% 38%)`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function hashHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export function telHref(phone: string): string {
  const d = phone.replace(/[^\d+]/g, "");
  return `tel:${d}`;
}

export function waHref(phone: string, text = ""): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = `88${d}`;
  if (!d.startsWith("88")) d = `88${d}`;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${d}${q}`;
}

export function downloadText(filename: string, content: string, mime = "application/json"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
