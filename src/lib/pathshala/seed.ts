import { addDays, format, parseISO } from "date-fns";
import { generateRoutine, seedRequirements } from "./routine.ts";
import { hashHue } from "./format.ts";
import type {
  AppData,
  AttendanceRecord,
  AttendanceSession,
  BankQuestion,
  Enquiry,
  Exam,
  ExamMark,
  Expense,
  Invoice,
  Paper,
  Payment,
  Student,
  Teacher,
} from "./types.ts";

function student(p: Omit<Student, "avatarHue" | "whatsapp" | "version" | "notes"> & Partial<Student>): Student {
  return {
    whatsapp: p.phone,
    version: "bangla",
    notes: "",
    avatarHue: hashHue(p.name),
    ...p,
  };
}

function buildStudents(): Student[] {
  return [
    student({
      id: "st-01", code: "AE-26-001", name: "Ariyan Hasan", nameBn: "আরিয়ান হাসান",
      phone: "01711001001", guardianName: "Mahmud Hasan", guardianPhone: "01711001011",
      grade: "3", group: "none", school: "Dhanmondi Govt. Primary", address: "Dhanmondi 8, Dhaka",
      admissionDate: "2026-01-12", admissionFee: 1000, monthlyFee: 1500, status: "active", batchIds: ["b-35"],
    }),
    student({
      id: "st-02", code: "AE-26-002", name: "Mim Akter", nameBn: "মিম আক্তার",
      phone: "01711001002", guardianName: "Shirin Akter", guardianPhone: "01711001012",
      grade: "3", group: "none", school: "Ideal School, Motijheel", address: "Hazaribagh, Dhaka",
      admissionDate: "2026-01-14", admissionFee: 1000, monthlyFee: 1500, status: "active", batchIds: ["b-35"],
    }),
    student({
      id: "st-03", code: "AE-26-003", name: "Nayeem Islam", nameBn: "নাঈম ইসলাম",
      phone: "01711001003", guardianName: "Rafiqul Islam", guardianPhone: "01711001013",
      grade: "4", group: "none", school: "Dhanmondi Govt. Primary", address: "Dhanmondi 8, Dhaka",
      admissionDate: "2026-02-03", admissionFee: 1000, monthlyFee: 1200, status: "active", batchIds: ["b-35"],
      notes: "Sibling discount. Guardian shared with cousin in Class 5.", siblingOf: "st-06",
    }),
    student({
      id: "st-04", code: "AE-26-004", name: "Sadia Rahman", nameBn: "সাদিয়া রহমান",
      phone: "01711001004", guardianName: "Farhana Rahman", guardianPhone: "01711001014",
      grade: "4", group: "none", school: "Viqarunnisa Noon School", address: "Kalabagan, Dhaka",
      admissionDate: "2026-01-20", admissionFee: 1000, monthlyFee: 1500, status: "active", batchIds: ["b-35"],
    }),
    student({
      id: "st-05", code: "AE-26-005", name: "Rafi Ahmed", nameBn: "রাফি আহমেদ",
      phone: "01711001005", guardianName: "Kamal Ahmed", guardianPhone: "01711001015",
      grade: "5", group: "none", school: "BAF Shaheen School", address: "Tejgaon, Dhaka",
      admissionDate: "2026-03-02", admissionFee: 1000, monthlyFee: 1500, status: "active", batchIds: ["b-35"],
    }),
    student({
      id: "st-06", code: "AE-26-006", name: "Tasmia Jahan", nameBn: "তাসমিয়া জাহান",
      phone: "01711001006", guardianName: "Rafiqul Islam", guardianPhone: "01711001013",
      grade: "5", group: "none", school: "Dhanmondi Govt. Primary", address: "Dhanmondi 8, Dhaka",
      admissionDate: "2026-02-03", admissionFee: 1000, monthlyFee: 1200, status: "active", batchIds: ["b-35"],
      notes: "Sibling of Nayeem. Same guardian phone.", siblingOf: "st-03",
    }),
    student({
      id: "st-07", code: "AE-26-007", name: "Shakib Hasan", nameBn: "সাকিব হাসান",
      phone: "01711001007", guardianName: "Nasrin Hasan", guardianPhone: "01711001017",
      grade: "6", group: "none", school: "Motijheel Ideal School", address: "Shantinagar, Dhaka",
      admissionDate: "2026-01-08", admissionFee: 1200, monthlyFee: 1800, status: "active", batchIds: ["b-6"],
    }),
    student({
      id: "st-08", code: "AE-26-008", name: "Fariha Noor", nameBn: "ফারিহা নূর",
      phone: "01711001008", guardianName: "Ayesha Noor", guardianPhone: "01711001018",
      grade: "6", group: "none", school: "Viqarunnisa Noon School", address: "Dhanmondi 15, Dhaka",
      admissionDate: "2026-04-11", admissionFee: 1200, monthlyFee: 1800, status: "active", batchIds: ["b-6"],
      notes: "Joined mid-April. Earlier April classes not enrolled.",
    }),
    student({
      id: "st-09", code: "AE-26-009", name: "Adnan Kabir", nameBn: "আদনান কবির",
      phone: "01711001009", guardianName: "Tariq Kabir", guardianPhone: "01711001019",
      grade: "7", group: "none", school: "Ideal School, Motijheel", address: "Rampura, Dhaka",
      admissionDate: "2026-01-10", admissionFee: 1200, monthlyFee: 1800, status: "active", batchIds: ["b-7"],
    }),
    student({
      id: "st-10", code: "AE-26-010", name: "Lamia Chowdhury", nameBn: "লামিয়া চৌধুরী",
      phone: "01711001010", guardianName: "Rehana Chowdhury", guardianPhone: "01711001020",
      grade: "7", group: "none", school: "Holy Cross School", address: "Tejgaon, Dhaka",
      admissionDate: "2026-02-18", admissionFee: 1200, monthlyFee: 2000, status: "active", batchIds: ["b-7"],
    }),
    student({
      id: "st-11", code: "AE-26-011", name: "Yasin Ali", nameBn: "ইয়াসিন আলী",
      phone: "01711002001", guardianName: "Shahid Ali", guardianPhone: "01711002011",
      grade: "7", group: "none", school: "St. Joseph Higher Secondary", address: "Mohammadpur, Dhaka",
      admissionDate: "2025-11-02", admissionFee: 1200, monthlyFee: 1800, status: "paused", batchIds: ["b-7"],
      notes: "Paused during school exam month. May return in October.",
    }),
    student({
      id: "st-12", code: "AE-26-012", name: "Nafisa Khan", nameBn: "নাফিসা খান",
      phone: "01711002002", guardianName: "Imtiaz Khan", guardianPhone: "01711002012",
      grade: "9", group: "commerce", school: "Viqarunnisa Noon School", address: "Lalmatia, Dhaka",
      admissionDate: "2026-01-05", admissionFee: 2000, monthlyFee: 2500, status: "active", batchIds: ["b-9c"],
    }),
    student({
      id: "st-13", code: "AE-26-013", name: "Farhan Uddin", nameBn: "ফারহান উদ্দিন",
      phone: "01711002003", guardianName: "Jalal Uddin", guardianPhone: "01711002013",
      grade: "9", group: "commerce", school: "Dhaka College", address: "New Market, Dhaka",
      admissionDate: "2026-01-06", admissionFee: 2000, monthlyFee: 2500, status: "active", batchIds: ["b-9c"],
      notes: "Often late on fees. Promised 20 Sep.",
    }),
    student({
      id: "st-14", code: "AE-26-014", name: "Anika Tasnim", nameBn: "আনিকা তাসনিম",
      phone: "01711002004", guardianName: "Shamima Tasnim", guardianPhone: "01711002014",
      grade: "10", group: "science", school: "Viqarunnisa Noon School", address: "Dhanmondi 4, Dhaka",
      admissionDate: "2026-01-04", admissionFee: 2500, monthlyFee: 3000, status: "active", batchIds: ["b-10s"],
    }),
    student({
      id: "st-15", code: "AE-26-015", name: "Mehraj Hossain", nameBn: "মেহরাজ হোসেন",
      phone: "01711002005", guardianName: "Abul Hossain", guardianPhone: "01711002015",
      grade: "10", group: "science", school: "Notre Dame College", address: "Motijheel, Dhaka",
      admissionDate: "2026-06-15", admissionFee: 2500, monthlyFee: 3000, status: "active", batchIds: ["b-10s"],
      notes: "Joined mid-year before half-yearly. Strong in Physics.",
    }),
  ];
}

function teachers(): Teacher[] {
  return [
    {
      id: "t-rahman", name: "Rahman Sir", nameBn: "রহমান স্যার", phone: "01811000001",
      subjectIds: ["s-10-phy", "s-10-hm"], joiningDate: "2023-01-10", address: "Mohammadpur",
      notes: "Prefers Physics in the first science slot.", payRules: [{ type: "per_class", rate: 600 }],
      unavailable: [{ day: "sun", slotId: "p1" }], status: "active", maxPerWeek: 12, maxPerDay: 4,
      preferredSlotIds: ["p2", "p3"], preferredDays: ["sun", "tue", "thu"], kind: "class",
    },
    {
      id: "t-farzana", name: "Farzana Miss", nameBn: "ফারজানা মিস", phone: "01811000002",
      subjectIds: ["s-35-ban", "s-6-ban", "s-7-ban"], joiningDate: "2022-06-01", address: "Dhanmondi",
      notes: "Bangla for junior + Class 6–7.", payRules: [{ type: "monthly", rate: 18000 }],
      unavailable: [], status: "active", maxPerWeek: 14, maxPerDay: 4, preferredSlotIds: [], preferredDays: [], kind: "monthly",
    },
    {
      id: "t-karim", name: "Karim Sir", nameBn: "করিম স্যার", phone: "01811000003",
      subjectIds: ["s-35-eng", "s-6-eng", "s-7-eng", "s-9-eng", "s-10-eng"], joiningDate: "2024-02-01",
      address: "Kalabagan", notes: "English across almost every batch.",
      payRules: [{ type: "per_class", rate: 500 }], unavailable: [], status: "active", maxPerWeek: 16, maxPerDay: 5,
      preferredSlotIds: [], preferredDays: [], kind: "class",
    },
    {
      id: "t-nabila", name: "Nabila Miss", nameBn: "নাবিলা মিস", phone: "01811000004",
      subjectIds: ["s-9-acc", "s-9-bus"], joiningDate: "2023-08-12", address: "Lalmatia",
      notes: "Commerce only.", payRules: [{ type: "monthly", rate: 14000 }, { type: "per_class", rate: 450, subjectId: "s-9-acc" }],
      unavailable: [{ day: "thu", slotId: "p5" }], status: "active", maxPerWeek: 10, maxPerDay: 3,
      preferredSlotIds: ["p1", "p2", "p3"], preferredDays: ["sun", "mon", "tue", "wed"], kind: "monthly",
    },
    {
      id: "t-hasan", name: "Hasan Sir", nameBn: "হাসান স্যার", phone: "01811000005",
      subjectIds: ["s-35-sci", "s-6-sci", "s-7-sci", "s-10-che"], joiningDate: "2021-03-01",
      address: "Mirpur", notes: "Science + Chemistry. Guide teacher — paid by the hour.", payRules: [{ type: "hourly", rate: 400 }],
      unavailable: [], status: "active", maxPerWeek: 14, maxPerDay: 4, preferredSlotIds: [], preferredDays: [], kind: "guide",
    },
    {
      id: "t-sultana", name: "Sultana Miss", nameBn: "সুলতানা মিস", phone: "01811000006",
      subjectIds: ["s-35-bgs", "s-10-bio"], joiningDate: "2024-01-15", address: "Shyamoli",
      notes: "", payRules: [{ type: "per_class", rate: 500 }], unavailable: [], status: "active", maxPerWeek: 10, maxPerDay: 3,
      preferredSlotIds: [], preferredDays: [],
    },
    {
      id: "t-imran", name: "Imran Sir", nameBn: "ইমরান স্যার", phone: "01811000007",
      subjectIds: ["s-35-mat", "s-6-mat", "s-7-mat", "s-10-hm"], joiningDate: "2022-11-01",
      address: "Farmgate", notes: "Cannot take P1 on Sunday.", payRules: [{ type: "per_class", rate: 550 }],
      unavailable: [{ day: "sun", slotId: "p1" }], status: "active", maxPerWeek: 14, maxPerDay: 4,
      preferredSlotIds: ["p2", "p3", "p4"], preferredDays: [],
    },
    {
      id: "t-tania", name: "Tania Miss", nameBn: "তানিয়া মিস", phone: "01811000008",
      subjectIds: ["s-6-ict", "s-7-ict", "s-9-fin", "s-10-ict"], joiningDate: "2025-01-08",
      address: "Adabor", notes: "Prefers after 6:00 PM.", payRules: [{ type: "monthly", rate: 12000 }],
      unavailable: [
        { day: "sun", slotId: "p1" }, { day: "sun", slotId: "p2" },
        { day: "mon", slotId: "p1" }, { day: "mon", slotId: "p2" },
        { day: "tue", slotId: "p1" }, { day: "tue", slotId: "p2" },
        { day: "wed", slotId: "p1" }, { day: "wed", slotId: "p2" },
        { day: "thu", slotId: "p1" }, { day: "thu", slotId: "p2" },
      ],
      status: "active", maxPerWeek: 10, maxPerDay: 3, preferredSlotIds: ["p3", "p4", "p5"], preferredDays: [],
    },
  ];
}

function invoicesFor(students: Student[]): Invoice[] {
  const months = [
    { m: "2026-07", due: "2026-07-10" },
    { m: "2026-08", due: "2026-08-10" },
    { m: "2026-09", due: "2026-09-10" },
  ];
  const inv: Invoice[] = [];
  for (const s of students) {
    if (s.status === "dropped") continue;
    inv.push({
      id: `inv-adm-${s.id}`, studentId: s.id, kind: "admission", month: null,
      title: "Admission fee", amount: s.admissionFee, dueDate: s.admissionDate, waived: false,
    });
    for (const { m, due } of months) {
      if (s.admissionDate.slice(0, 7) > m) continue;
      inv.push({
        id: `inv-${s.id}-${m}`, studentId: s.id, kind: "tuition", month: m,
        title: `Tuition ${m}`, amount: s.monthlyFee, dueDate: due, waived: false,
      });
    }
  }
  return inv;
}

function paymentsFor(students: Student[], invoices: Invoice[]): Payment[] {
  const pays: Payment[] = [];
  let seq = 1;
  const rec = () => `RCP-26-${String(seq++).padStart(4, "0")}`;
  const pay = (
    studentId: string,
    amount: number,
    at: string,
    method: Payment["method"],
    monthIds: string[],
    extra?: Partial<Payment>,
  ): Payment => {
    const allocations = monthIds.map((id) => {
      const inv = invoices.find((i) => i.id === id);
      return { invoiceId: id, amount: inv?.amount ?? 0 };
    });
    const allocated = allocations.reduce((s, a) => s + a.amount, 0);
    return {
      id: `pay-${studentId}-${at}`,
      studentId, amount, method, reference: "", at, receiptNo: rec(),
      allocations, credit: Math.max(0, amount - allocated), voided: false, note: "",
      ...extra,
    };
  };

  for (const s of students) {
    const adm = `inv-adm-${s.id}`;
    pays.push(pay(s.id, s.admissionFee, `${s.admissionDate}T16:20:00`, "cash", [adm]));
  }

  const fully = ["st-02", "st-04", "st-09", "st-12", "st-14"];
  for (const id of fully) {
    const s = students.find((x) => x.id === id)!;
    for (const m of ["2026-07", "2026-08", "2026-09"]) {
      const inv = invoices.find((i) => i.id === `inv-${id}-${m}`);
      if (!inv) continue;
      pays.push(pay(id, s.monthlyFee, `${m}-08T17:10:00`, m === "2026-09" ? "bkash" : "cash", [inv.id]));
    }
  }

  for (const id of ["st-01", "st-05", "st-07", "st-10"]) {
    const s = students.find((x) => x.id === id)!;
    for (const m of ["2026-07", "2026-08"]) {
      pays.push(pay(id, s.monthlyFee, `${m}-09T17:00:00`, "cash", [`inv-${id}-${m}`]));
    }
  }

  pays.push(pay("st-03", 2400, "2026-07-11T16:40:00", "nagad", ["inv-st-03-2026-07", "inv-st-03-2026-08"]));
  pays.push(pay("st-06", 1200, "2026-07-11T16:42:00", "nagad", ["inv-st-06-2026-07"]));
  pays.push(pay("st-08", 1800, "2026-08-10T18:00:00", "cash", ["inv-st-08-2026-08"]));
  pays.push(pay("st-13", 2500, "2026-07-12T17:30:00", "cash", ["inv-st-13-2026-07"]));
  pays.push(pay("st-15", 6000, "2026-08-05T16:15:00", "bank", ["inv-st-15-2026-07", "inv-st-15-2026-08"], {
    note: "Paid two months together — applied oldest first.",
  }));
  pays.push(pay("st-11", 1800, "2026-07-08T16:00:00", "cash", ["inv-st-11-2026-07"]));

  return pays;
}

function classDaysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let d = parseISO(from);
  const end = parseISO(to);
  while (d <= end) {
    const wd = d.getDay();
    if (wd >= 0 && wd <= 4) out.push(format(d, "yyyy-MM-dd"));
    d = addDays(d, 1);
  }
  return out;
}

function attendanceHistory(
  data: Pick<AppData, "routineEntries" | "students" | "routineVersions">,
): AttendanceSession[] {
  const published = data.routineVersions.find((v) => v.status === "published");
  if (!published) return [];
  const days = classDaysBetween("2026-09-01", "2026-09-17");
  const sessions: AttendanceSession[] = [];
  const chronic = new Set(["st-13"]);
  const lateOften = new Set(["st-05", "st-07"]);
  for (const date of days) {
    const wd = parseISO(date).getDay();
    const dayKey = (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[wd];
    const entries = data.routineEntries.filter((e) => e.versionId === published.id && e.day === dayKey);
    for (const e of entries) {
      const roster = data.students.filter((s) => s.batchIds.includes(e.batchId) && s.status === "active");
      const records: AttendanceRecord[] = roster.map((s) => {
        if (s.admissionDate > date) return { studentId: s.id, status: "not_enrolled" };
        if (chronic.has(s.id) && (date.endsWith("15") || date.endsWith("16") || date.endsWith("17"))) {
          return { studentId: s.id, status: "absent", reason: "Guardian said school programme" };
        }
        if (lateOften.has(s.id) && date.endsWith("14")) {
          return { studentId: s.id, status: "late", inTime: "18:12", outTime: "20:00" };
        }
        return { studentId: s.id, status: "present", inTime: "16:55", outTime: "20:02" };
      });
      sessions.push({
        id: `att-${date}-${e.id}`,
        date,
        entryId: e.id,
        held: true,
        makeup: false,
        savedAt: `${date}T20:10:00`,
        records,
        edits: [],
      });
    }
  }
  return sessions;
}

function bankQuestions(): BankQuestion[] {
  return [
    {
      id: "q1", gradeKey: "10", subjectId: "s-10-phy", chapter: "Motion", topic: "Acceleration",
      type: "mcq", difficulty: "mid", marks: 1,
      text: "A body starting from rest travels 20 m in 2 s with constant acceleration. Acceleration is",
      textBn: "বিশ্রাম থেকে যাত্রা করে ধ্রুব ত্বরণে ২ সেকেন্ডে ২০ মিটার গেলে ত্বরণ",
      options: [
        { id: "q1-a", key: "A", text: "5 m/s²" }, { id: "q1-b", key: "B", text: "10 m/s²" },
        { id: "q1-c", key: "C", text: "15 m/s²" }, { id: "q1-d", key: "D", text: "20 m/s²" },
      ],
      answer: "B", correctOptionId: "q1-b", usedCount: 1,
    },
    {
      id: "q2", gradeKey: "10", subjectId: "s-10-phy", chapter: "Motion", topic: "Graph",
      type: "cq", difficulty: "hard", marks: 10,
      text: "A velocity-time graph of a particle is a straight line through the origin. (a) What does the slope represent? (b) Sketch the displacement-time graph. (c) Find displacement in 4 s if v = 3t.",
      answer: "Slope = acceleration. s = 24 m", usedCount: 0,
    },
    {
      id: "q3", gradeKey: "9", subjectId: "s-9-acc", chapter: "Journal", topic: "Entry",
      type: "short", difficulty: "easy", marks: 2,
      text: "What is a journal? Write one example of a cash purchase entry.",
      textBn: "জার্নাল কী? নগদ ক্রয়ের একটি উদাহরণ লিখুন।",
      answer: "Book of original entry. Dr Purchases Cr Cash", usedCount: 2,
    },
    {
      id: "q4", gradeKey: "3-5", subjectId: "s-35-ban", chapter: "ব্যাকরণ", topic: "সন্ধি",
      type: "mcq", difficulty: "easy", marks: 1,
      text: "‘সূর্যোদয়’ শব্দে কোন সন্ধি?",
      options: [
        { id: "q4-a", key: "ক", text: "স্বরসন্ধি" }, { id: "q4-b", key: "খ", text: "ব্যঞ্জনসন্ধি" },
        { id: "q4-c", key: "গ", text: "বিসর্গসন্ধি" }, { id: "q4-d", key: "ঘ", text: "সন্ধি নেই" },
      ],
      answer: "ক", correctOptionId: "q4-a", usedCount: 0,
    },
    {
      id: "q5", gradeKey: "3-5", subjectId: "s-35-mat", chapter: "Fractions", topic: "Add",
      type: "short", difficulty: "mid", marks: 3,
      text: "Add: 1/2 + 1/3 + 1/6",
      textBn: "যোগ করো: ১/২ + ১/৩ + ১/৬",
      answer: "1", usedCount: 0,
    },
    {
      id: "q6", gradeKey: "10", subjectId: "s-10-eng", chapter: "Unseen", topic: "Article",
      type: "blank", difficulty: "mid", marks: 5,
      text: "Fill in the blanks with appropriate articles: __ honest man is __ asset to __ society.",
      answer: "An, an, —", usedCount: 0,
    },
    {
      id: "q7", gradeKey: "7", subjectId: "s-7-sci", chapter: "Heat", topic: "Conductors",
      type: "tf", difficulty: "easy", marks: 1,
      text: "Wood is a good conductor of heat.",
      textBn: "কাঠ তাপের সুপরিবাহী।",
      answer: "False", usedCount: 0,
    },
    {
      id: "q8", gradeKey: "10", subjectId: "s-10-che", chapter: "Acid", topic: "pH",
      type: "mcq", difficulty: "mid", marks: 1,
      text: "pH of a neutral solution at 25°C is",
      options: [
        { id: "q8-a", key: "A", text: "0" }, { id: "q8-b", key: "B", text: "7" },
        { id: "q8-c", key: "C", text: "14" }, { id: "q8-d", key: "D", text: "1" },
      ],
      answer: "B", correctOptionId: "q8-b", usedCount: 1,
    },
  ];
}

function samplePaper(): Paper {
  return {
    id: "paper-ssc-eng",
    title: "SSC Model Test — English 1st Paper",
    examName: "Weekly Model Test",
    gradeKey: "10",
    subjectId: "s-10-eng",
    date: "2026-09-20",
    durationMin: 90,
    fullMarks: 100,
    setLabel: "A",
    instructions: "Answer all questions. Figures in the right margin indicate full marks. Answer any 3 from Section B.",
    status: "ready",
    updatedAt: "2026-09-16T20:00:00",
    sections: [
      {
        id: "sec-mcq",
        title: "Section A — Multiple Choice",
        instruction: "Choose the correct answer. 1 mark each.",
        questions: [
          {
            id: "pq1", number: "1", type: "mcq", marks: 1,
            text: "The synonym of ‘rapid’ is —",
            options: [
              { id: "pq1-a", key: "A", text: "slow" }, { id: "pq1-b", key: "B", text: "quick" },
              { id: "pq1-c", key: "C", text: "late" }, { id: "pq1-d", key: "D", text: "idle" },
            ],
            correctOptionId: "pq1-b",
            answer: "B",
          },
          {
            id: "pq2", number: "2", type: "mcq", marks: 1,
            text: "He is interested __ painting.",
            options: [
              { id: "pq2-a", key: "A", text: "on" }, { id: "pq2-b", key: "B", text: "at" },
              { id: "pq2-c", key: "C", text: "in" }, { id: "pq2-d", key: "D", text: "for" },
            ],
            correctOptionId: "pq2-c",
            answer: "C",
          },
        ],
      },
      {
        id: "sec-cq",
        title: "Section B — Creative / CQ",
        instruction: "Answer any 3 of the following. 10 marks each.",
        answerAny: 3,
        questions: [
          {
            id: "pq3", number: "3", type: "cq", marks: 10,
            text: "Read the stem: Rina plants trees every year around her school.",
            subs: [
              { label: "a", text: "What is afforestation?", marks: 1 },
              { label: "b", text: "Why does Rina plant trees?", marks: 2 },
              { label: "c", text: "How does this help the environment?", marks: 3 },
              { label: "d", text: "Give your opinion on student-led green campaigns.", marks: 4 },
            ],
          },
          {
            id: "pq4", number: "4", type: "cq", marks: 10,
            text: "Stem: A fisherman could not go to the river during the storm.",
            subs: [
              { label: "a", text: "What is a natural disaster?", marks: 1 },
              { label: "b", text: "Why could he not go?", marks: 2 },
              { label: "c", text: "Describe the effects of cyclones in coastal Bangladesh.", marks: 3 },
              { label: "d", text: "How can communities prepare?", marks: 4 },
            ],
          },
        ],
      },
      {
        id: "sec-gr",
        title: "Section C — Grammar",
        instruction: "Answer all.",
        questions: [
          {
            id: "pq5", number: "5", type: "blank", marks: 5,
            text: "Fill in the blanks with suitable articles / prepositions as required.",
          },
          {
            id: "pq6", number: "6", type: "short", marks: 10,
            text: "Changing voice and narration — five sentences.",
          },
        ],
      },
    ],
  };
}

export function emptyData(): AppData {
  return {
    coaching: {
      name: "Advance Educare",
      nameBn: "অ্যাডভান্স এডুকেয়ার",
      address: "Ground Floor, Dhanmondi, Dhaka",
      phone: "01711-000111",
      session: "2026",
      dueDay: 10,
      hours: "4:00 PM – 8:30 PM",
      fridayNote: "Friday off for classes. Office 4:00–8:00 PM.",
    },
    settings: {
      lang: "en",
      pinEnabled: false,
      pin: "",
      locked: false,
      lastBackupAt: null,
      setupComplete: true,
      lockedMonth: null,
      dark: false,
      privacyMode: false,
      sampleData: true,
    },
    slots: [
      { id: "p1", label: "4:00–5:00", start: "16:00", end: "17:00", order: 1 },
      { id: "p2", label: "5:00–6:00", start: "17:00", end: "18:00", order: 2 },
      { id: "p3", label: "6:00–7:00", start: "18:00", end: "19:00", order: 3 },
      { id: "p4", label: "7:00–8:00", start: "19:00", end: "20:00", order: 4 },
      { id: "p5", label: "8:00–8:30", start: "20:00", end: "20:30", order: 5 },
    ],
    rooms: [
      { id: "r-a", name: "Room A", capacity: 20, facilities: ["whiteboard"] },
      { id: "r-b", name: "Room B", capacity: 16, facilities: ["whiteboard", "AC"] },
      { id: "r-c", name: "Room C", capacity: 12, facilities: ["whiteboard"] },
      { id: "r-d", name: "Room D", capacity: 10, facilities: ["projector"] },
    ],
    subjects: [],
    batches: [],
    teachers: [],
    students: [],
    notes: [],
    transfers: [],
    enquiries: [],
    routineVersions: [],
    routineRequirements: [],
    routineEntries: [],
    overrides: [],
    attendance: [],
    teacherAttendance: [],
    invoices: [],
    payments: [],
    promises: [],
    accounts: [
      { id: "acc-cash", name: "Cash box", type: "cash" },
      { id: "acc-bkash", name: "bKash", type: "bkash" },
      { id: "acc-nagad", name: "Nagad", type: "nagad" },
      { id: "acc-bank", name: "Bank", type: "bank" },
    ],
    expenses: [],
    otherIncome: [],
    payouts: [],
    cashCloses: [],
    exams: [],
    marks: [],
    bank: [],
    papers: [],
    activity: [],
    printDocs: [],
    openingBalances: { "acc-cash": 0, "acc-bkash": 0, "acc-nagad": 0, "acc-bank": 0 },
    receiptSeq: 1,
  };
}

let cachedSeed: AppData | null = null;

export function seedAdvanceEducare(): AppData {
  if (!cachedSeed) cachedSeed = buildAdvanceEducare();
  return structuredClone(cachedSeed);
}

function buildAdvanceEducare(): AppData {
  const data = emptyData();
  data.subjects = [
    { id: "s-35-ban", name: "Bangla", nameBn: "বাংলা", gradeKey: "3-5" },
    { id: "s-35-eng", name: "English", nameBn: "ইংরেজি", gradeKey: "3-5" },
    { id: "s-35-mat", name: "Math", nameBn: "গণিত", gradeKey: "3-5" },
    { id: "s-35-sci", name: "Science", nameBn: "বিজ্ঞান", gradeKey: "3-5" },
    { id: "s-35-bgs", name: "BGS", nameBn: "বিজিএস", gradeKey: "3-5" },
    { id: "s-6-ban", name: "Bangla", nameBn: "বাংলা", gradeKey: "6" },
    { id: "s-6-eng", name: "English", nameBn: "ইংরেজি", gradeKey: "6" },
    { id: "s-6-mat", name: "Math", nameBn: "গণিত", gradeKey: "6" },
    { id: "s-6-sci", name: "Science", nameBn: "বিজ্ঞান", gradeKey: "6" },
    { id: "s-6-ict", name: "ICT", nameBn: "আইসিটি", gradeKey: "6" },
    { id: "s-7-ban", name: "Bangla", nameBn: "বাংলা", gradeKey: "7" },
    { id: "s-7-eng", name: "English", nameBn: "ইংরেজি", gradeKey: "7" },
    { id: "s-7-mat", name: "Math", nameBn: "গণিত", gradeKey: "7" },
    { id: "s-7-sci", name: "Science", nameBn: "বিজ্ঞান", gradeKey: "7" },
    { id: "s-7-ict", name: "ICT", nameBn: "আইসিটি", gradeKey: "7" },
    { id: "s-9-acc", name: "Accounting", nameBn: "হিসাববিজ্ঞান", gradeKey: "9c" },
    { id: "s-9-bus", name: "Business Ent.", nameBn: "ব্যবসায় উদ্যোগ", gradeKey: "9c" },
    { id: "s-9-fin", name: "Finance", nameBn: "ফিন্যান্স", gradeKey: "9c" },
    { id: "s-9-eng", name: "English", nameBn: "ইংরেজি", gradeKey: "9c" },
    { id: "s-10-phy", name: "Physics", nameBn: "পদার্থ", gradeKey: "10s" },
    { id: "s-10-che", name: "Chemistry", nameBn: "রসায়ন", gradeKey: "10s" },
    { id: "s-10-bio", name: "Biology", nameBn: "জীববিজ্ঞান", gradeKey: "10s" },
    { id: "s-10-hm", name: "Higher Math", nameBn: "উচ্চতর গণিত", gradeKey: "10s" },
    { id: "s-10-eng", name: "English", nameBn: "ইংরেজি", gradeKey: "10s" },
    { id: "s-10-ict", name: "ICT", nameBn: "আইসিটি", gradeKey: "10s" },
  ];
  data.batches = [
    { id: "b-35", name: "Class 3–5 Combined", gradeKey: "3-5", group: "none", version: "bangla", capacity: 16, minStart: "17:00", defaultFee: 1500, maxPerDay: 3, shareGroup: "junior" },
    { id: "b-6", name: "Class 6", gradeKey: "6", group: "none", version: "bangla", capacity: 12, minStart: "18:00", defaultFee: 1800, maxPerDay: 3, shareGroup: "mid" },
    { id: "b-7", name: "Class 7", gradeKey: "7", group: "none", version: "bangla", capacity: 12, minStart: null, defaultFee: 1800, maxPerDay: 3, shareGroup: "mid" },
    { id: "b-9c", name: "Class 9 Commerce", gradeKey: "9c", group: "commerce", version: "bangla", capacity: 10, minStart: null, defaultFee: 2500, maxPerDay: 3 },
    { id: "b-10s", name: "Class 10 Science", gradeKey: "10s", group: "science", version: "bangla", capacity: 10, minStart: null, defaultFee: 3000, maxPerDay: 3 },
  ];
  data.teachers = teachers();
  data.students = buildStudents();
  data.accounts = [
    { id: "acc-cash", name: "Cash box", type: "cash" },
    { id: "acc-bkash", name: "bKash", type: "bkash" },
    { id: "acc-nagad", name: "Nagad", type: "nagad" },
    { id: "acc-bank", name: "Bank", type: "bank" },
  ];
  data.openingBalances = { "acc-cash": 12500, "acc-bkash": 8200, "acc-nagad": 2400, "acc-bank": 48000 };
  data.invoices = invoicesFor(data.students);
  data.payments = paymentsFor(data.students, data.invoices);
  data.receiptSeq = data.payments.length + 1;

  data.routineVersions = [
    { id: "rv-sep", name: "September 2026", status: "published", kind: "regular", operatingDays: ["sun", "mon", "tue", "wed", "thu"], createdAt: "2026-09-01T10:00:00" },
    { id: "rv-exam", name: "Half-yearly exam routine", status: "draft", kind: "exam", operatingDays: ["sat"], createdAt: "2026-09-12T18:00:00" },
  ];
  data.routineRequirements = seedRequirements("rv-sep");
  const saturdayPins = [
    {
      id: "re-sat-eng",
      versionId: "rv-sep",
      day: "sat" as const,
      slotId: "p1",
      batchId: "b-10s",
      subjectId: "s-10-eng",
      teacherId: "t-karim",
      roomId: "r-a",
      pinned: true,
    },
    {
      id: "re-sat-acc",
      versionId: "rv-sep",
      day: "sat" as const,
      slotId: "p2",
      batchId: "b-9c",
      subjectId: "s-9-acc",
      teacherId: "t-nabila",
      roomId: "r-b",
      pinned: true,
    },
  ];
  data.routineEntries = saturdayPins;
  const gen = generateRoutine(
    data,
    "rv-sep",
    data.routineRequirements.map((r) => ({
      id: r.id,
      batchId: r.batchId,
      subjectId: r.subjectId,
      perWeek: r.perWeek,
      preferredTeacherId: r.preferredTeacherId,
      allowSameDay: r.allowSameDay,
    })),
    saturdayPins,
    { timeBudgetMs: 1200 },
  );
  data.routineEntries = gen.entries;

  data.attendance = attendanceHistory(data);
  data.promises = [
    { id: "pr-1", studentId: "st-13", amount: 5000, date: "2026-09-20", note: "Will clear Aug + Sep", done: false },
    { id: "pr-2", studentId: "st-03", amount: 1200, date: "2026-09-22", note: "September after salary", done: false },
  ];
  data.notes = [
    { id: "n1", studentId: "st-13", at: "2026-09-12T18:10:00", kind: "promise", text: "Jalal uncle will pay 20 Sep after garment overtime." },
    { id: "n2", studentId: "st-14", at: "2026-09-10T19:00:00", kind: "academic", text: "Anika is weak in Higher Math graphs. Extra sheet given." },
    { id: "n3", studentId: "st-07", at: "2026-09-14T18:20:00", kind: "guardian", text: "Mother said school tiffin delay — often 10 min late." },
    { id: "n4", studentId: "st-05", at: "2026-09-08T17:40:00", kind: "health", text: "Mild asthma. Keep near window in Room A." },
  ];
  data.enquiries = [
    {
      id: "enq-1", studentName: "Orpa Sultana", phone: "01611009901", guardianName: "Mizan Sultana",
      classGrade: "8", school: "Viqarunnisa", interestedBatchId: null, source: "walkin",
      followUpDate: "2026-09-19", notes: "Will admit next month after school first-term result.",
      status: "open", createdAt: "2026-09-10T16:30:00",
    },
    {
      id: "enq-2", studentName: "Tahmid Reza", phone: "01611009902", guardianName: "Rezaul Karim",
      classGrade: "10", school: "Notre Dame", interestedBatchId: "b-10s", source: "referral",
      followUpDate: "2026-09-18", notes: "Referred by Mehraj. Asked Physics + Chemistry fees.",
      status: "open", createdAt: "2026-09-15T17:10:00",
    },
    {
      id: "enq-3", studentName: "Nusrat Jahan", phone: "01611009903", guardianName: "Unknown",
      classGrade: "5", school: "Ideal", interestedBatchId: "b-35", source: "phone",
      followUpDate: "2026-09-12", notes: "Called about batch time. Did not visit.",
      status: "open", createdAt: "2026-09-05T15:00:00",
    },
    {
      id: "enq-4", studentName: "Samiul Haque", phone: "01611009904", guardianName: "Anwar Haque",
      classGrade: "9", school: "Dhaka College", interestedBatchId: "b-9c", source: "walkin",
      followUpDate: null, notes: "Joined wait — actually admitted as enquiry converted in January archive.",
      status: "joined", createdAt: "2026-01-02T16:00:00",
    },
  ] satisfies Enquiry[];

  const expenses: Expense[] = [
    { id: "ex-rent", category: "Rent", amount: 25000, accountId: "acc-bank", date: "2026-09-05", note: "September rent", recurring: "monthly" },
    { id: "ex-el", category: "Electricity", amount: 4200, accountId: "acc-cash", date: "2026-09-08", note: "DESCO" },
    { id: "ex-pr", category: "Printing/stationery", amount: 1800, accountId: "acc-cash", date: "2026-09-16", note: "A4 + toner" },
    { id: "ex-sn", category: "Snacks", amount: 350, accountId: "acc-cash", date: "2026-09-17", note: "Teacher tea" },
    { id: "ex-mk", category: "Marketing", amount: 2500, accountId: "acc-bkash", date: "2026-09-02", note: "Banner reprint" },
  ];
  data.expenses = expenses;
  data.payouts = [
    { id: "po-1", teacherId: "t-farzana", amount: 18000, date: "2026-08-30", note: "August salary", month: "2026-08" },
    { id: "po-2", teacherId: "t-tania", amount: 12000, date: "2026-08-30", note: "August salary", month: "2026-08" },
    { id: "po-3", teacherId: "t-nabila", amount: 14000, date: "2026-08-31", note: "August salary", month: "2026-08" },
  ];
  data.otherIncome = [
    { id: "oi-1", title: "Old book sale", amount: 800, accountId: "acc-cash", date: "2026-09-11" },
  ];
  data.cashCloses = [
    { id: "cc-1", date: "2026-09-17", expected: 14800, actual: 14800, note: "Matched" },
  ];

  const exams: Exam[] = [
    { id: "exm-1", name: "Weekly test", date: "2026-09-13", gradeKey: "10s", subjectId: "s-10-phy", fullMarks: 20, paperId: "paper-ssc-eng" },
    { id: "exm-2", name: "Weekly test", date: "2026-09-13", gradeKey: "9c", subjectId: "s-9-acc", fullMarks: 20 },
    { id: "exm-3", name: "Model test 1", date: "2026-09-19", gradeKey: "10s", subjectId: "s-10-eng", fullMarks: 100, paperId: "paper-ssc-eng" },
  ];
  data.exams = exams;
  const marks: ExamMark[] = [
    { examId: "exm-1", studentId: "st-14", marks: 18, status: "sat" },
    { examId: "exm-1", studentId: "st-15", marks: 16, status: "sat" },
    { examId: "exm-2", studentId: "st-12", marks: 17, status: "sat" },
    { examId: "exm-2", studentId: "st-13", marks: 11, status: "sat" },
  ];
  data.marks = marks;
  data.bank = bankQuestions();
  data.papers = [samplePaper()];

  data.activity = [
    { id: "a1", at: "2026-09-17T20:12:00", text: "Attendance saved for Thursday classes.", textBn: "বৃহস্পতিবারের হাজিরা সংরক্ষিত।" },
    { id: "a2", at: "2026-09-16T17:10:00", text: "Collected ৳1,800 printing expense from cash.", textBn: "প্রিন্টিং খরচ ৳১,৮০০ নগদ থেকে।" },
    { id: "a3", at: "2026-09-15T17:10:00", text: "New enquiry: Tahmid Reza (Class 10 Science).", textBn: "নতুন এনকোয়ারি: তাহমিদ রেজা।" },
    { id: "a4", at: "2026-09-12T18:10:00", text: "Farhan's guardian promised payment on 20 Sep.", textBn: "ফারহানের অভিভাবক ২০ সেপ্টেম্বর পরিশোধের প্রতিশ্রুতি।" },
  ];
  data.printDocs = [];
  data.settings.lastBackupAt = "2026-08-30T21:00:00";
  return data;
}
