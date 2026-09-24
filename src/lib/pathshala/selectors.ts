import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { studentDue, collectedOn, expensesOn, accountBalance, lastPayment } from "./fees";
import { entriesForDate } from "./routine";
import { dayKeyFromISO, dateISO } from "./format";
import type { AppData } from "./types";

export interface ActionItem {
  id: string;
  kind: "fee" | "absence" | "teacher" | "enquiry" | "promise" | "backup" | "paper";
  title: string;
  titleBn: string;
  href: string;
  meta: string;
}

export function todayISO(): string {
  return dateISO(new Date());
}

export function classesOn(data: AppData, date: string) {
  return entriesForDate(data, date, dayKeyFromISO(date));
}

export function nextDate(iso: string): string {
  return format(addDays(parseISO(iso), 1), "yyyy-MM-dd");
}

export function dashboardStats(data: AppData, today: string) {
  const classes = classesOn(data, today);
  const sessions = data.attendance.filter((a) => a.date === today);
  const present = sessions.reduce(
    (n, s) => n + s.records.filter((r) => r.status === "present" || r.status === "late").length,
    0,
  );
  const ym = today.slice(0, 7);
  const newAdmissions = data.students.filter((s) => s.admissionDate.startsWith(ym)).length;
  const openEnq = data.enquiries.filter((e) => e.status === "open" && e.followUpDate && e.followUpDate <= today).length;
  const due = data.students.filter((s) => s.status === "active").reduce((n, s) => n + studentDue(data, s.id), 0);
  return {
    collection: collectedOn(data, today),
    expense: expensesOn(data, today) + data.payouts.filter((p) => p.date === today).reduce((n, p) => n + p.amount, 0),
    cash: accountBalance(data, "acc-cash"),
    due,
    present,
    classes: classes.length,
    newAdmissions,
    followUps: openEnq,
    lastBackup: data.settings.lastBackupAt,
    classesList: classes,
  };
}

export function actionItems(data: AppData, today: string): ActionItem[] {
  const items: ActionItem[] = [];
  for (const s of data.students.filter((x) => x.status === "active")) {
    const due = studentDue(data, s.id);
    if (due > 0) {
      const last = lastPayment(data, s.id);
      items.push({
        id: `due-${s.id}`,
        kind: "fee",
        title: `${s.name} owes ৳${due.toLocaleString("en-IN")}`,
        titleBn: `${s.nameBn}-এর বকেয়া ৳${due.toLocaleString("en-IN")}`,
        href: `/students/${s.id}`,
        meta: last ? `Last paid ${last.at.slice(0, 10)}` : "No tuition payment on file",
      });
    }
  }

  const consecutive = consecutiveAbsences(data, today);
  for (const row of consecutive.filter((c) => c.count >= 3)) {
    items.push({
      id: `abs-${row.studentId}`,
      kind: "absence",
      title: `${row.name} absent ${row.count} classes in a row`,
      titleBn: `${row.nameBn} টানা ${row.count} ক্লাস অনুপস্থিত`,
      href: `/students/${row.studentId}`,
      meta: "Call guardian",
    });
  }

  for (const p of data.promises.filter((x) => !x.done && x.date <= today)) {
    const st = data.students.find((s) => s.id === p.studentId);
    if (!st) continue;
    items.push({
      id: `pr-${p.id}`,
      kind: "promise",
      title: `${st.name} promised ৳${p.amount.toLocaleString("en-IN")} by ${p.date}`,
      titleBn: `${st.nameBn} ${p.date}-এর মধ্যে পরিশোধের কথা`,
      href: `/students/${st.id}`,
      meta: p.note,
    });
  }

  for (const e of data.enquiries.filter((x) => x.status === "open" && x.followUpDate && x.followUpDate <= today)) {
    items.push({
      id: `enq-${e.id}`,
      kind: "enquiry",
      title: `Call ${e.studentName} (Class ${e.classGrade})`,
      titleBn: `${e.studentName}-কে ফোন করুন`,
      href: "/enquiries",
      meta: e.notes.slice(0, 80),
    });
  }

  if (!data.settings.lastBackupAt) {
    items.push({
      id: "bak",
      kind: "backup",
      title: "No backup on this device yet",
      titleBn: "এখনো ব্যাকআপ হয়নি",
      href: "/settings",
      meta: "Download a file you can keep in Drive",
    });
  } else {
    const days = differenceInCalendarDays(parseISO(today), parseISO(data.settings.lastBackupAt.slice(0, 10)));
    if (days >= 30) {
      items.push({
        id: "bak-old",
        kind: "backup",
        title: `Backup is ${days} days old`,
        titleBn: `ব্যাকআপ ${days} দিনের পুরনো`,
        href: "/settings",
        meta: data.settings.lastBackupAt.slice(0, 10),
      });
    }
  }

  const draft = data.papers.find((p) => p.status === "draft");
  if (draft) {
    items.push({
      id: `paper-${draft.id}`,
      kind: "paper",
      title: `Unfinished paper: ${draft.title}`,
      titleBn: `অসম্পূর্ণ প্রশ্নপত্র: ${draft.title}`,
      href: "/papers",
      meta: "Draft still open",
    });
  }

  return items;
}

export function consecutiveAbsences(data: AppData, today: string) {
  const out: { studentId: string; name: string; nameBn: string; count: number }[] = [];
  for (const st of data.students.filter((s) => s.status === "active")) {
    const records = data.attendance
      .flatMap((a) => a.records.filter((r) => r.studentId === st.id).map((r) => ({ date: a.date, ...r })))
      .filter((r) => r.date <= today && r.status !== "not_enrolled")
      .sort((a, b) => b.date.localeCompare(a.date));
    let count = 0;
    for (const r of records) {
      if (r.status === "absent") count++;
      else break;
    }
    if (count > 0) out.push({ studentId: st.id, name: st.name, nameBn: st.nameBn, count });
  }
  return out;
}

export function attendancePct(data: AppData, studentId: string): number {
  const recs = data.attendance.flatMap((a) =>
    a.records.filter((r) => r.studentId === studentId && r.status !== "not_enrolled"),
  );
  if (!recs.length) return 100;
  const ok = recs.filter((r) => r.status === "present" || r.status === "late" || r.status === "excused").length;
  return Math.round((ok / recs.length) * 100);
}

export function searchAll(data: AppData, q: string) {
  const n = q.trim().toLowerCase();
  if (!n) return { students: [], teachers: [], payments: [], enquiries: [], batches: [], papers: [] };
  const has = (s: string) => s.toLowerCase().includes(n);
  return {
    students: data.students.filter(
      (s) =>
        has(s.name) ||
        has(s.nameBn) ||
        has(s.code) ||
        has(s.phone) ||
        has(s.guardianPhone) ||
        has(s.school) ||
        has(s.guardianName),
    ),
    teachers: data.teachers.filter((t) => has(t.name) || has(t.nameBn) || has(t.phone)),
    payments: data.payments.filter((p) => has(p.receiptNo) || has(p.reference)),
    enquiries: data.enquiries.filter((e) => has(e.studentName) || has(e.phone)),
    batches: data.batches.filter((b) => has(b.name)),
    papers: data.papers.filter((p) => has(p.title) || has(p.examName)),
  };
}
