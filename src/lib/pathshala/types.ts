export type Lang = "en" | "bn";
export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
export type StudentStatus =
  | "active"
  | "dropped"
  | "paused"
  | "completed"
  | "transferred"
  | "suspended";
export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "excused"
  | "left_early"
  | "not_enrolled";
export type PayMethod = "cash" | "bkash" | "nagad" | "bank" | "card" | "other";
export type AccountType = "cash" | "bkash" | "nagad" | "bank";
export type FeeKind =
  | "tuition"
  | "admission"
  | "exam"
  | "books"
  | "id_card"
  | "registration"
  | "model_test"
  | "special"
  | "other";
export type QuestionType =
  | "mcq"
  | "short"
  | "cq"
  | "tf"
  | "blank"
  | "match"
  | "essay";
export type TeacherPayType = "monthly" | "per_class" | "hourly";
export type TeacherKind = "class" | "guide" | "monthly";
export type CapabilityPolicy = "hard" | "warning" | "ignore";
export type RoutineKind = "regular" | "exam" | "ramadan" | "special";

export const CLASS_DAYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu"];
export const ALL_DAYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export interface CoachingProfile {
  name: string;
  nameBn: string;
  address: string;
  phone: string;
  session: string;
  dueDay: number;
  hours: string;
  fridayNote: string;
}

export interface Slot {
  id: string;
  label: string;
  start: string;
  end: string;
  order: number;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  facilities: string[];
}

export interface Subject {
  id: string;
  name: string;
  nameBn: string;
  gradeKey: string;
}

export interface Batch {
  id: string;
  name: string;
  gradeKey: string;
  group: "none" | "science" | "commerce" | "humanities";
  version: "bangla" | "english";
  capacity: number;
  minStart: string | null;
  defaultFee: number;
  maxPerDay?: number;
  /** Batches with the same non-empty group may sit in one room at the same time. */
  shareGroup?: string | null;
}

export interface TeacherPayRule {
  type: TeacherPayType;
  rate: number;
  subjectId?: string;
}

export interface Teacher {
  id: string;
  name: string;
  nameBn: string;
  phone: string;
  subjectIds: string[];
  joiningDate: string;
  address: string;
  nid?: string;
  notes: string;
  payRules: TeacherPayRule[];
  unavailable: { day: DayKey; slotId: string }[];
  status: "active" | "left";
  maxPerWeek: number;
  maxPerDay?: number;
  preferredSlotIds?: string[];
  preferredDays?: DayKey[];
  kind?: TeacherKind;
}

export interface Student {
  id: string;
  code: string;
  name: string;
  nameBn: string;
  phone: string;
  whatsapp: string;
  guardianName: string;
  guardianPhone: string;
  grade: string;
  version: "bangla" | "english";
  group: "none" | "science" | "commerce" | "humanities";
  school: string;
  address: string;
  admissionDate: string;
  admissionFee: number;
  monthlyFee: number;
  status: StudentStatus;
  batchIds: string[];
  notes: string;
  avatarHue: number;
  siblingOf?: string;
  photoData?: string;
}

export interface StudentNote {
  id: string;
  studentId: string;
  at: string;
  kind:
    | "academic"
    | "promise"
    | "guardian"
    | "discipline"
    | "health"
    | "fee"
    | "other";
  text: string;
}

export interface BatchTransfer {
  id: string;
  studentId: string;
  fromBatchId: string | null;
  toBatchId: string;
  at: string;
  reason: string;
}

export interface Enquiry {
  id: string;
  studentName: string;
  phone: string;
  guardianName: string;
  classGrade: string;
  school: string;
  interestedBatchId: string | null;
  source: "walkin" | "phone" | "referral" | "facebook" | "other";
  followUpDate: string | null;
  notes: string;
  status: "open" | "joined" | "lost";
  createdAt: string;
}

export interface RoutineVersion {
  id: string;
  name: string;
  status: "draft" | "published" | "archived";
  kind: RoutineKind;
  operatingDays: DayKey[];
  createdAt: string;
}

export interface RoutineRequirement {
  id: string;
  versionId: string;
  batchId: string;
  subjectId: string;
  perWeek: number;
  preferredTeacherId: string | null;
  allowSameDay: boolean;
}

export interface RoutineEntry {
  id: string;
  versionId: string;
  day: DayKey;
  slotId: string;
  batchId: string;
  subjectId: string;
  teacherId: string;
  roomId: string;
  pinned: boolean;
}

export interface DayOverride {
  id: string;
  date: string;
  entryId: string;
  type: "cancel" | "replace" | "move" | "makeup";
  reason: string;
  newTeacherId?: string;
  newSlotId?: string;
  newRoomId?: string;
  newDate?: string;
}

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  inTime?: string;
  outTime?: string;
  reason?: string;
}

export interface AttendanceSession {
  id: string;
  date: string;
  entryId: string;
  held: boolean;
  cancelReason?: string;
  makeup: boolean;
  savedAt: string;
  records: AttendanceRecord[];
  edits: { at: string; note: string }[];
}

export interface Invoice {
  id: string;
  studentId: string;
  kind: FeeKind;
  month: string | null;
  title: string;
  amount: number;
  dueDate: string;
  waived: boolean;
}

export interface PaymentAlloc {
  invoiceId: string;
  amount: number;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  method: PayMethod;
  reference: string;
  at: string;
  receiptNo: string;
  allocations: PaymentAlloc[];
  credit: number;
  voided: boolean;
  voidReason?: string;
  note: string;
}

export interface PaymentPromise {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  note: string;
  done: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  accountId: string;
  date: string;
  note: string;
  recurring?: "monthly";
}

export interface OtherIncome {
  id: string;
  title: string;
  amount: number;
  accountId: string;
  date: string;
}

export interface TeacherAttendance {
  id: string;
  date: string;
  teacherId: string;
  entryId: string | null;
  status: "present" | "absent" | "late";
  hours: number;
  note: string;
}

export interface TeacherPayout {
  id: string;
  teacherId: string;
  amount: number;
  date: string;
  note: string;
  month: string;
}

export interface CashClose {
  id: string;
  date: string;
  expected: number;
  actual: number;
  note: string;
}

export interface Exam {
  id: string;
  name: string;
  date: string;
  gradeKey: string;
  subjectId: string;
  fullMarks: number;
  paperId?: string;
}

export interface ExamMark {
  examId: string;
  studentId: string;
  marks: number | null;
  status: "sat" | "absent" | "retake";
}

export interface McqOption {
  id: string;
  key: string;
  text: string;
}

export interface BankQuestion {
  id: string;
  gradeKey: string;
  subjectId: string;
  chapter: string;
  topic: string;
  type: QuestionType;
  difficulty: "easy" | "mid" | "hard";
  marks: number;
  text: string;
  textBn?: string;
  options?: McqOption[];
  answer: string;
  correctOptionId?: string;
  usedCount: number;
}

export interface PaperQuestion {
  id: string;
  bankId?: string;
  number: string;
  text: string;
  marks: number;
  type: QuestionType;
  imageData?: string;
  options?: McqOption[];
  correctOptionId?: string;
  answer?: string;
  subs?: { label: string; text: string; marks: number }[];
}

export interface PaperSection {
  id: string;
  title: string;
  instruction: string;
  answerAny?: number;
  questions: PaperQuestion[];
}

export interface Paper {
  id: string;
  title: string;
  examName: string;
  gradeKey: string;
  subjectId: string;
  date: string;
  durationMin: number;
  fullMarks: number;
  setLabel: string;
  instructions: string;
  sections: PaperSection[];
  status: "draft" | "ready";
  updatedAt: string;
  scans?: { id: string; imageData: string; note: string }[];
}

export interface Activity {
  id: string;
  at: string;
  text: string;
  textBn: string;
}

export interface PrintDoc {
  id: string;
  kind: string;
  title: string;
  at: string;
  html: string;
}

export interface AppSettings {
  lang: Lang;
  pinEnabled: boolean;
  pin: string;
  locked: boolean;
  lastBackupAt: string | null;
  setupComplete: boolean;
  lockedMonth: string | null;
  dark: boolean;
  privacyMode: boolean;
  sampleData: boolean;
}

export interface AppData {
  coaching: CoachingProfile;
  settings: AppSettings;
  slots: Slot[];
  rooms: Room[];
  subjects: Subject[];
  batches: Batch[];
  teachers: Teacher[];
  students: Student[];
  notes: StudentNote[];
  transfers: BatchTransfer[];
  enquiries: Enquiry[];
  routineVersions: RoutineVersion[];
  routineRequirements: RoutineRequirement[];
  routineEntries: RoutineEntry[];
  overrides: DayOverride[];
  attendance: AttendanceSession[];
  teacherAttendance: TeacherAttendance[];
  invoices: Invoice[];
  payments: Payment[];
  promises: PaymentPromise[];
  accounts: Account[];
  expenses: Expense[];
  otherIncome: OtherIncome[];
  payouts: TeacherPayout[];
  cashCloses: CashClose[];
  exams: Exam[];
  marks: ExamMark[];
  bank: BankQuestion[];
  papers: Paper[];
  activity: Activity[];
  printDocs: PrintDoc[];
  openingBalances: Record<string, number>;
  receiptSeq: number;
}
