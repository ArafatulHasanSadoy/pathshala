import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { nid, nextCode } from "./ids";
import { seedAdvanceEducare, emptyData } from "./seed.ts";
import { allocateOldest } from "./fees";
import { generateRoutine, type Demand, type GenerateResult } from "./routine";
import { dateISO, monthISO } from "./format";
import type {
  AppData,
  AttendanceRecord,
  AttendanceStatus,
  Enquiry,
  Expense,
  Lang,
  Paper,
  PayMethod,
  Student,
  StudentStatus,
  DayKey,
  RoutineRequirement,
} from "./types";

export interface Store extends AppData {
  hydrated: boolean;
  setHydrated: () => void;
  ensureSeeded: () => void;
  resetDemo: () => void;
  startFresh: (profile: Partial<AppData["coaching"]>) => void;
  log: (text: string, textBn: string) => void;
  setLang: (lang: Lang) => void;
  setPrivacy: (on: boolean) => void;
  setPin: (pin: string, enabled: boolean) => void;
  setLocked: (locked: boolean) => void;
  markBackup: () => void;
  restoreFrom: (data: AppData) => void;
  updateCoaching: (patch: Partial<AppData["coaching"]>) => void;

  addStudent: (s: Omit<Student, "id" | "code" | "avatarHue"> & { avatarHue?: number }) => Student;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  addNote: (studentId: string, kind: AppData["notes"][0]["kind"], text: string) => void;
  transferBatch: (studentId: string, toBatchId: string, reason: string) => void;

  addEnquiry: (e: Omit<Enquiry, "id" | "createdAt" | "status">) => Enquiry;
  updateEnquiry: (id: string, patch: Partial<Enquiry>) => void;

  generateMonthFees: (ym: string) => number;
  collectFee: (input: {
    studentId: string;
    amount: number;
    method: PayMethod;
    reference: string;
    at?: string;
    overpay: "credit" | "future";
    note?: string;
  }) => { receiptNo: string; paymentId: string };
  voidPayment: (id: string, reason: string) => void;
  movePayment: (id: string, toStudentId: string) => void;
  addPromise: (studentId: string, amount: number, date: string, note: string) => void;
  completePromise: (id: string) => void;
  addInvoice: (studentId: string, kind: AppData["invoices"][0]["kind"], title: string, amount: number, month?: string) => void;

  saveAttendance: (session: {
    date: string;
    entryId: string;
    held: boolean;
    cancelReason?: string;
    makeup?: boolean;
    records: AttendanceRecord[];
  }) => void;
  patchAttendance: (sessionId: string, studentId: string, status: AttendanceStatus, extra?: Partial<AttendanceRecord>, note?: string) => void;

  publishRoutine: (versionId: string) => void;
  setEntry: (entry: AppData["routineEntries"][0]) => void;
  removeEntry: (id: string) => void;
  togglePin: (id: string) => void;
  saveRequirements: (rows: RoutineRequirement[]) => void;
  runGenerate: (versionId: string, demands?: Demand[]) => GenerateResult;
  addOverride: (o: Omit<AppData["overrides"][0], "id">) => void;
  addMakeup: (input: { date: string; day: DayKey; slotId: string; batchId: string; subjectId: string; teacherId: string; roomId: string; reason: string }) => void;

  addExpense: (e: Omit<Expense, "id">) => void;
  addIncome: (title: string, amount: number, accountId: string, date: string) => void;
  payTeacher: (teacherId: string, amount: number, month: string, note: string) => void;
  closeCash: (date: string, expected: number, actual: number, note: string) => void;

  addExam: (name: string, date: string, gradeKey: string, subjectId: string, fullMarks: number) => string;
  setMark: (examId: string, studentId: string, marks: number | null, status: AppData["marks"][0]["status"]) => void;

  savePaper: (paper: Paper) => void;
  addBankQuestion: (q: Omit<AppData["bank"][0], "id" | "usedCount">) => void;

  rememberPrint: (kind: string, title: string, html: string) => void;
  upsertBatch: (b: AppData["batches"][0]) => void;
  removeBatch: (id: string) => void;
  upsertRoom: (r: AppData["rooms"][0]) => void;
  removeRoom: (id: string) => void;
  upsertSlot: (slot: AppData["slots"][0]) => void;
  upsertSubject: (s: AppData["subjects"][0]) => void;
  upsertTeacher: (t: AppData["teachers"][0]) => void;
  saveTeacherAttendance: (row: AppData["teacherAttendance"][0]) => void;
}

const STORAGE_KEY = "pathshala-v4";

function cloneSeed(): AppData {
  return structuredClone(seedAdvanceEducare());
}

export const useApp = create<Store>()(
  persist(
    (set, get) => ({
      ...cloneSeed(),
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      ensureSeeded: () => {
        const s = get();
        if (!s.coaching || !s.settings) {
          set({ ...cloneSeed(), hydrated: true });
          return;
        }
        if (!Array.isArray(s.routineRequirements)) {
          set({ routineRequirements: [] });
        }
        if (!Array.isArray(s.teacherAttendance)) {
          set({ teacherAttendance: [] });
        }
        if (s.settings.sampleData === undefined) {
          set({ settings: { ...s.settings, sampleData: s.students.length > 0, privacyMode: s.settings.privacyMode ?? false } });
        }
      },
      resetDemo: () => set({ ...cloneSeed(), hydrated: true }),
      startFresh: (profile) => {
        const base = emptyData();
        const versionId = nid("rv");
        set({
          ...base,
          coaching: {
            ...base.coaching,
            name: profile.name ?? "My coaching",
            nameBn: profile.nameBn ?? profile.name ?? "আমার কোচিং",
            address: profile.address ?? "",
            phone: profile.phone ?? "",
            session: profile.session ?? String(new Date().getFullYear()),
            dueDay: profile.dueDay ?? 10,
            hours: profile.hours ?? "4:00 PM – 8:30 PM",
            fridayNote: profile.fridayNote ?? "Friday off for classes. Office open.",
          },
          settings: {
            ...base.settings,
            sampleData: false,
            setupComplete: true,
            lang: get().settings.lang,
          },
          rooms: [
            { id: nid("rm"), name: "Room A", capacity: 20, facilities: ["whiteboard"] },
            { id: nid("rm"), name: "Room B", capacity: 16, facilities: ["whiteboard"] },
          ],
          routineVersions: [
            {
              id: versionId,
              name: "Regular",
              status: "published",
              kind: "regular",
              operatingDays: ["sun", "mon", "tue", "wed", "thu"],
              createdAt: new Date().toISOString(),
            },
          ],
          hydrated: true,
        });
        get().log("Started a fresh coaching on this phone.", "এই ফোনে নতুন কোচিং শুরু হয়েছে।");
      },
      log: (text, textBn) =>
        set((s) => ({
          activity: [{ id: nid("act"), at: new Date().toISOString(), text, textBn }, ...s.activity].slice(0, 200),
        })),
      setLang: (lang) => set((s) => ({ settings: { ...s.settings, lang } })),
      setPrivacy: (on) => set((s) => ({ settings: { ...s.settings, privacyMode: on } })),
      setPin: (pin, enabled) => set((s) => ({ settings: { ...s.settings, pin, pinEnabled: enabled } })),
      setLocked: (locked) => set((s) => ({ settings: { ...s.settings, locked } })),
      markBackup: () =>
        set((s) => ({ settings: { ...s.settings, lastBackupAt: new Date().toISOString() } })),
      restoreFrom: (data) => set({ ...data, hydrated: true }),
      updateCoaching: (patch) => set((s) => ({ coaching: { ...s.coaching, ...patch } })),

      addStudent: (input) => {
        const s = get();
        const student: Student = {
          avatarHue: input.avatarHue ?? Math.abs(input.name.length * 37) % 360,
          ...input,
          id: nid("st"),
          code: nextCode(s.students.map((x) => x.code), "AE-26-"),
        };
        set({ students: [student, ...s.students] });
        get().log(`Admitted ${student.name} (${student.code}).`, `${student.nameBn} ভর্তি (${student.code})।`);
        return student;
      },
      updateStudent: (id, patch) =>
        set((s) => ({ students: s.students.map((st) => (st.id === id ? { ...st, ...patch } : st)) })),
      addNote: (studentId, kind, text) =>
        set((s) => ({
          notes: [{ id: nid("note"), studentId, at: new Date().toISOString(), kind, text }, ...s.notes],
        })),
      transferBatch: (studentId, toBatchId, reason) => {
        const s = get();
        const st = s.students.find((x) => x.id === studentId);
        if (!st) return;
        const from = st.batchIds[0] ?? null;
        set({
          students: s.students.map((x) =>
            x.id === studentId ? { ...x, batchIds: [toBatchId] } : x,
          ),
          transfers: [
            { id: nid("tr"), studentId, fromBatchId: from, toBatchId, at: new Date().toISOString(), reason },
            ...s.transfers,
          ],
        });
        get().log(`Transferred ${st.name} to a new batch.`, `${st.nameBn}-এর ব্যাচ বদল।`);
      },

      addEnquiry: (e) => {
        const row: Enquiry = { ...e, id: nid("enq"), createdAt: new Date().toISOString(), status: "open" };
        set((s) => ({ enquiries: [row, ...s.enquiries] }));
        return row;
      },
      updateEnquiry: (id, patch) =>
        set((s) => ({ enquiries: s.enquiries.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),

      generateMonthFees: (ym) => {
        const s = get();
        const dueDay = String(s.coaching.dueDay).padStart(2, "0");
        let n = 0;
        const extra: AppData["invoices"] = [];
        for (const st of s.students.filter((x) => x.status === "active")) {
          if (st.admissionDate.slice(0, 7) > ym) continue;
          const exists = s.invoices.some((i) => i.studentId === st.id && i.month === ym && i.kind === "tuition");
          if (exists) continue;
          extra.push({
            id: nid("inv"),
            studentId: st.id,
            kind: "tuition",
            month: ym,
            title: `Tuition ${ym}`,
            amount: st.monthlyFee,
            dueDate: `${ym}-${dueDay}`,
            waived: false,
          });
          n++;
        }
        set({ invoices: [...s.invoices, ...extra] });
        get().log(`Generated ${n} tuition invoices for ${ym}.`, `${ym} মাসের ${n}টি ফি তৈরি।`);
        return n;
      },
      collectFee: (input) => {
        const s = get();
        const { allocations, leftover } = allocateOldest(s, input.studentId, input.amount);
        let credit = 0;
        const extraAlloc = [...allocations];
        if (leftover > 0 && input.overpay === "future") {
          const next = nextMonth(monthISO());
          const dueDay = String(s.coaching.dueDay).padStart(2, "0");
          const inv = {
            id: nid("inv"),
            studentId: input.studentId,
            kind: "tuition" as const,
            month: next,
            title: `Tuition ${next}`,
            amount: leftover,
            dueDate: `${next}-${dueDay}`,
            waived: false,
          };
          extraAlloc.push({ invoiceId: inv.id, amount: leftover });
          set({ invoices: [...get().invoices, inv] });
        } else if (leftover > 0) {
          credit = leftover;
        }
        const receiptNo = `RCP-26-${String(get().receiptSeq).padStart(4, "0")}`;
        const paymentId = nid("pay");
        const at = input.at ?? new Date().toISOString();
        set((cur) => ({
          receiptSeq: cur.receiptSeq + 1,
          payments: [
            {
              id: paymentId,
              studentId: input.studentId,
              amount: input.amount,
              method: input.method,
              reference: input.reference,
              at,
              receiptNo,
              allocations: extraAlloc,
              credit,
              voided: false,
              note: input.note ?? "",
            },
            ...cur.payments,
          ],
        }));
        const st = get().students.find((x) => x.id === input.studentId);
        get().log(
          `Collected ৳${input.amount} from ${st?.name ?? "student"} (${receiptNo}).`,
          `${st?.nameBn ?? "শিক্ষার্থী"} থেকে ৳${input.amount} আদায় (${receiptNo})।`,
        );
        return { receiptNo, paymentId };
      },
      voidPayment: (id, reason) =>
        set((s) => ({
          payments: s.payments.map((p) => (p.id === id ? { ...p, voided: true, voidReason: reason } : p)),
        })),
      movePayment: (id, toStudentId) =>
        set((s) => ({
          payments: s.payments.map((p) => (p.id === id ? { ...p, studentId: toStudentId } : p)),
        })),
      addPromise: (studentId, amount, date, note) =>
        set((s) => ({
          promises: [{ id: nid("pr"), studentId, amount, date, note, done: false }, ...s.promises],
        })),
      completePromise: (id) =>
        set((s) => ({ promises: s.promises.map((p) => (p.id === id ? { ...p, done: true } : p)) })),
      addInvoice: (studentId, kind, title, amount, month) =>
        set((s) => ({
          invoices: [
            ...s.invoices,
            {
              id: nid("inv"),
              studentId,
              kind,
              month: month ?? null,
              title,
              amount,
              dueDate: dateISO(),
              waived: false,
            },
          ],
        })),

      saveAttendance: (session) => {
        const existing = get().attendance.find(
          (a) => a.date === session.date && a.entryId === session.entryId,
        );
        const row: AppData["attendance"][0] = {
          id: existing?.id ?? nid("att"),
          date: session.date,
          entryId: session.entryId,
          held: session.held,
          cancelReason: session.cancelReason,
          makeup: session.makeup ?? false,
          savedAt: new Date().toISOString(),
          records: session.records,
          edits: existing
            ? [...existing.edits, { at: new Date().toISOString(), note: "Resaved attendance" }]
            : [],
        };
        set((s) => ({
          attendance: existing
            ? s.attendance.map((a) => (a.id === existing.id ? row : a))
            : [row, ...s.attendance],
        }));
        get().log("Attendance saved.", "হাজিরা সংরক্ষিত।");
      },
      patchAttendance: (sessionId, studentId, status, extra, note) =>
        set((s) => ({
          attendance: s.attendance.map((a) =>
            a.id !== sessionId
              ? a
              : {
                  ...a,
                  records: a.records.map((r) =>
                    r.studentId === studentId ? { ...r, status, ...extra } : r,
                  ),
                  edits: [...a.edits, { at: new Date().toISOString(), note: note ?? `Status → ${status}` }],
                },
          ),
        })),

      publishRoutine: (versionId) =>
        set((s) => ({
          routineVersions: s.routineVersions.map((v) =>
            v.id === versionId
              ? { ...v, status: "published" }
              : { ...v, status: v.status === "published" ? "archived" : v.status },
          ),
        })),
      setEntry: (entry) =>
        set((s) => {
          const exists = s.routineEntries.some((e) => e.id === entry.id);
          return {
            routineEntries: exists
              ? s.routineEntries.map((e) => (e.id === entry.id ? entry : e))
              : [...s.routineEntries, entry],
          };
        }),
      removeEntry: (id) => set((s) => ({ routineEntries: s.routineEntries.filter((e) => e.id !== id) })),
      togglePin: (id) =>
        set((s) => ({
          routineEntries: s.routineEntries.map((e) => (e.id === id ? { ...e, pinned: !e.pinned } : e)),
        })),
      saveRequirements: (rows) => set({ routineRequirements: rows }),
      runGenerate: (versionId, demands) => {
        const s = get();
        const version = s.routineVersions.find((v) => v.id === versionId);
        const targetId = version?.status === "published" ? versionId : versionId;
        const pinned = s.routineEntries.filter((e) => e.versionId === targetId && e.pinned);
        const reqs =
          demands ??
          s.routineRequirements
            .filter((r) => r.versionId === targetId)
            .map((r) => ({
              id: r.id,
              batchId: r.batchId,
              subjectId: r.subjectId,
              perWeek: r.perWeek,
              preferredTeacherId: r.preferredTeacherId,
              allowSameDay: r.allowSameDay,
            }));
        const result = generateRoutine(s, targetId, reqs, pinned, { timeBudgetMs: 900 });
        set({
          routineEntries: [
            ...s.routineEntries.filter((e) => e.versionId !== targetId),
            ...result.entries,
          ],
        });
        get().log("Routine generated as a draft placement.", "রুটিন খসড়া তৈরি হয়েছে।");
        return result;
      },
      addOverride: (o) => set((s) => ({ overrides: [{ id: nid("ov"), ...o }, ...s.overrides] })),
      addMakeup: (input) => {
        const version = get().routineVersions.find((v) => v.status === "published");
        if (!version) return;
        const entry = {
          id: nid("re"),
          versionId: version.id,
          day: input.day,
          slotId: input.slotId,
          batchId: input.batchId,
          subjectId: input.subjectId,
          teacherId: input.teacherId,
          roomId: input.roomId,
          pinned: true,
        };
        set((s) => ({
          routineEntries: [...s.routineEntries, entry],
          overrides: [
            {
              id: nid("ov"),
              date: input.date,
              entryId: entry.id,
              type: "makeup",
              reason: input.reason,
            },
            ...s.overrides,
          ],
        }));
      },

      addExpense: (e) => set((s) => ({ expenses: [{ id: nid("ex"), ...e }, ...s.expenses] })),
      addIncome: (title, amount, accountId, date) =>
        set((s) => ({ otherIncome: [{ id: nid("oi"), title, amount, accountId, date }, ...s.otherIncome] })),
      payTeacher: (teacherId, amount, month, note) =>
        set((s) => ({
          payouts: [
            { id: nid("po"), teacherId, amount, date: dateISO(), note, month },
            ...s.payouts,
          ],
        })),
      closeCash: (date, expected, actual, note) =>
        set((s) => ({
          cashCloses: [{ id: nid("cc"), date, expected, actual, note }, ...s.cashCloses.filter((c) => c.date !== date)],
        })),

      addExam: (name, date, gradeKey, subjectId, fullMarks) => {
        const id = nid("exm");
        set((s) => ({ exams: [{ id, name, date, gradeKey, subjectId, fullMarks }, ...s.exams] }));
        return id;
      },
      setMark: (examId, studentId, marks, status) =>
        set((s) => {
          const exists = s.marks.some((m) => m.examId === examId && m.studentId === studentId);
          const row = { examId, studentId, marks, status };
          return {
            marks: exists
              ? s.marks.map((m) => (m.examId === examId && m.studentId === studentId ? row : m))
              : [...s.marks, row],
          };
        }),

      savePaper: (paper) =>
        set((s) => {
          const exists = s.papers.some((p) => p.id === paper.id);
          return { papers: exists ? s.papers.map((p) => (p.id === paper.id ? paper : p)) : [paper, ...s.papers] };
        }),
      addBankQuestion: (q) => set((s) => ({ bank: [{ id: nid("q"), usedCount: 0, ...q }, ...s.bank] })),
      rememberPrint: (kind, title, html) =>
        set((s) => ({
          printDocs: [{ id: nid("doc"), kind, title, at: new Date().toISOString(), html }, ...s.printDocs].slice(0, 40),
        })),
      upsertBatch: (b) =>
        set((s) => ({
          batches: s.batches.some((x) => x.id === b.id) ? s.batches.map((x) => (x.id === b.id ? b : x)) : [...s.batches, b],
        })),
      removeBatch: (id) => set((s) => ({ batches: s.batches.filter((b) => b.id !== id) })),
      upsertRoom: (r) =>
        set((s) => ({
          rooms: s.rooms.some((x) => x.id === r.id) ? s.rooms.map((x) => (x.id === r.id ? r : x)) : [...s.rooms, r],
        })),
      removeRoom: (id) => set((s) => ({ rooms: s.rooms.filter((r) => r.id !== id) })),
      upsertSlot: (slot) =>
        set((s) => ({
          slots: s.slots.some((x) => x.id === slot.id)
            ? s.slots.map((x) => (x.id === slot.id ? slot : x))
            : [...s.slots, slot].sort((a, b) => a.order - b.order),
        })),
      upsertSubject: (sub) =>
        set((s) => ({
          subjects: s.subjects.some((x) => x.id === sub.id)
            ? s.subjects.map((x) => (x.id === sub.id ? sub : x))
            : [...s.subjects, sub],
        })),
      upsertTeacher: (t) =>
        set((s) => ({
          teachers: s.teachers.some((x) => x.id === t.id)
            ? s.teachers.map((x) => (x.id === t.id ? t : x))
            : [...s.teachers, t],
        })),
      saveTeacherAttendance: (row) =>
        set((s) => {
          const list = s.teacherAttendance ?? [];
          const same = list.findIndex(
            (x) => x.teacherId === row.teacherId && x.date === row.date && (x.entryId ?? "") === (row.entryId ?? ""),
          );
          if (same >= 0) {
            const next = [...list];
            next[same] = { ...row, id: list[same]!.id };
            return { teacherAttendance: next };
          }
          return { teacherAttendance: [{ ...row, id: row.id || nid("ta") }, ...list] };
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.ensureSeeded();
        state?.setHydrated();
      },
      partialize: (s) => {
        const { hydrated: _h, ...rest } = s;
        const data: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rest)) {
          if (typeof v !== "function") data[k] = v;
        }
        return data as unknown as AppData;
      },
    },
  ),
);

if (typeof window !== "undefined") {
  void useApp.persist.rehydrate();
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y ?? 2026, m ?? 1, 1);
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function exportBackup(): string {
  const s = useApp.getState();
  const { hydrated: _h, ...rest } = s;
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (typeof v !== "function") data[k] = v;
  }
  return JSON.stringify({ pathshala: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}
