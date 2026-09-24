import { nid } from "./ids.ts";
import type {
  AppData,
  Batch,
  CapabilityPolicy,
  DayKey,
  RoutineEntry,
  RoutineRequirement,
  Slot,
  Teacher,
} from "./types.ts";
import { CLASS_DAYS } from "./types.ts";

export interface Demand {
  id?: string;
  batchId: string;
  subjectId: string;
  perWeek: number;
  preferredTeacherId?: string | null;
  allowSameDay?: boolean;
}

export interface Unplaced {
  batchId: string;
  subjectId: string;
  reasons: string[];
  relaxHints: string[];
}

export interface HardConflict {
  kind: "teacher" | "room" | "batch" | "overlap" | "pin" | "hours" | "unavailable";
  message: string;
  entryIds: string[];
}

export interface GenerateResult {
  entries: RoutineEntry[];
  warnings: string[];
  unplaced: Unplaced[];
  hardConflicts: HardConflict[];
  score: number;
  placed: number;
  demanded: number;
  nodes: number;
  timedOut: boolean;
}

export interface FitOption {
  batchId: string;
  subjectId: string;
  teacherId: string;
  roomId: string;
  warnings: string[];
  fillsNeed: boolean;
}

type Candidate = {
  day: DayKey;
  slot: Slot;
  teacher: Teacher;
  roomId: string;
  listed: boolean;
  preferredTeacher: boolean;
  preferredSlot: boolean;
  preferredDay: boolean;
};

type Unit = {
  id: string;
  reqId: string;
  batchId: string;
  subjectId: string;
  preferredTeacherId: string | null;
  allowSameDay: boolean;
  candidates: Candidate[];
};

type Occ = {
  teacher: Set<string>;
  room: Set<string>;
  roomWho: Map<string, string[]>;
  batch: Set<string>;
  subjectDay: Set<string>;
  batchDay: Map<string, number>;
  teacherDay: Map<string, number>;
  teacherWeek: Map<string, number>;
  slotBatches: Map<string, string[]>;
  share: Map<string, string>;
};

function key3(a: string, b: string, c: string) {
  return `${a}|${b}|${c}`;
}
function key2(a: string, b: string) {
  return `${a}|${b}`;
}

function bump(map: Map<string, number>, k: string, d = 1) {
  map.set(k, (map.get(k) ?? 0) + d);
}

function slotOk(batch: Batch, slot: Slot): boolean {
  if (!batch.minStart) return true;
  return slot.start >= batch.minStart;
}

function unavailable(teacher: Teacher, day: DayKey, slotId: string): boolean {
  return teacher.unavailable.some((u) => u.day === day && u.slotId === slotId);
}

function teacherMaxDay(teacher: Teacher): number {
  return teacher.maxPerDay ?? 4;
}

function batchMaxDay(batch: Batch): number {
  return batch.maxPerDay ?? 3;
}

function pairKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function overlappingBatchPairs(data: Pick<AppData, "students" | "batches">): Set<string> {
  const byBatch = new Map<string, Set<string>>();
  for (const st of data.students) {
    if (st.status !== "active") continue;
    for (const bid of st.batchIds) {
      const set = byBatch.get(bid) ?? new Set<string>();
      set.add(st.id);
      byBatch.set(bid, set);
    }
  }
  const pairs = new Set<string>();
  const ids = data.batches.map((b) => b.id);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i]!;
      const b = ids[j]!;
      const sa = byBatch.get(a);
      const sb = byBatch.get(b);
      if (!sa || !sb) continue;
      for (const sid of sa) {
        if (sb.has(sid)) {
          pairs.add(pairKey(a, b));
          break;
        }
      }
    }
  }
  return pairs;
}

function cloneOcc(o: Occ): Occ {
  return {
    teacher: new Set(o.teacher),
    room: new Set(o.room),
    roomWho: new Map([...o.roomWho.entries()].map(([k, v]) => [k, [...v]])),
    batch: new Set(o.batch),
    subjectDay: new Set(o.subjectDay),
    batchDay: new Map(o.batchDay),
    teacherDay: new Map(o.teacherDay),
    teacherWeek: new Map(o.teacherWeek),
    slotBatches: new Map([...o.slotBatches.entries()].map(([k, v]) => [k, [...v]])),
    share: o.share,
  };
}

function occupy(occ: Occ, c: Candidate, batchId: string, subjectId: string) {
  occ.teacher.add(key3(c.day, c.slot.id, c.teacher.id));
  const rk = key3(c.day, c.slot.id, c.roomId);
  occ.room.add(rk);
  const who = occ.roomWho.get(rk) ?? [];
  who.push(batchId);
  occ.roomWho.set(rk, who);
  occ.batch.add(key3(c.day, c.slot.id, batchId));
  occ.subjectDay.add(key3(c.day, batchId, subjectId));
  bump(occ.batchDay, key2(c.day, batchId));
  bump(occ.teacherDay, key2(c.day, c.teacher.id));
  bump(occ.teacherWeek, c.teacher.id);
  const sk = key2(c.day, c.slot.id);
  const list = occ.slotBatches.get(sk) ?? [];
  list.push(batchId);
  occ.slotBatches.set(sk, list);
}

function occupyEntry(occ: Occ, e: RoutineEntry) {
  occ.teacher.add(key3(e.day, e.slotId, e.teacherId));
  const rk = key3(e.day, e.slotId, e.roomId);
  occ.room.add(rk);
  const who = occ.roomWho.get(rk) ?? [];
  who.push(e.batchId);
  occ.roomWho.set(rk, who);
  occ.batch.add(key3(e.day, e.slotId, e.batchId));
  occ.subjectDay.add(key3(e.day, e.batchId, e.subjectId));
  bump(occ.batchDay, key2(e.day, e.batchId));
  bump(occ.teacherDay, key2(e.day, e.teacherId));
  bump(occ.teacherWeek, e.teacherId);
  const sk = key2(e.day, e.slotId);
  const list = occ.slotBatches.get(sk) ?? [];
  list.push(e.batchId);
  occ.slotBatches.set(sk, list);
}

function emptyOcc(share?: Map<string, string>): Occ {
  return {
    teacher: new Set(),
    room: new Set(),
    roomWho: new Map(),
    batch: new Set(),
    subjectDay: new Set(),
    batchDay: new Map(),
    teacherDay: new Map(),
    teacherWeek: new Map(),
    slotBatches: new Map(),
    share: share ?? new Map(),
  };
}

function roomClash(occ: Occ, day: string, slotId: string, roomId: string, batchId: string): boolean {
  const who = occ.roomWho.get(key3(day, slotId, roomId)) ?? [];
  if (who.length === 0) return false;
  const g = occ.share.get(batchId) ?? "";
  if (!g) return true;
  return who.some((id) => (occ.share.get(id) ?? "") !== g);
}

function hardBlocked(
  occ: Occ,
  c: Candidate,
  unit: Pick<Unit, "batchId" | "subjectId" | "allowSameDay">,
  batch: Batch,
  overlap: Set<string>,
): string | null {
  if (occ.teacher.has(key3(c.day, c.slot.id, c.teacher.id))) return "teacher";
  if (roomClash(occ, c.day, c.slot.id, c.roomId, unit.batchId)) return "room";
  if (occ.batch.has(key3(c.day, c.slot.id, unit.batchId))) return "batch";
  if (!unit.allowSameDay && occ.subjectDay.has(key3(c.day, unit.batchId, unit.subjectId))) return "same-subject";
  if ((occ.batchDay.get(key2(c.day, unit.batchId)) ?? 0) >= batchMaxDay(batch)) return "batch-day";
  if ((occ.teacherDay.get(key2(c.day, c.teacher.id)) ?? 0) >= teacherMaxDay(c.teacher)) return "teacher-day";
  if ((occ.teacherWeek.get(c.teacher.id) ?? 0) >= c.teacher.maxPerWeek) return "teacher-week";
  const others = occ.slotBatches.get(key2(c.day, c.slot.id)) ?? [];
  for (const other of others) {
    if (other !== unit.batchId && overlap.has(pairKey(unit.batchId, other))) return "student-overlap";
  }
  return null;
}

function consecutiveCount(occ: Occ, slots: Slot[], day: DayKey, slot: Slot, teacherId: string): number {
  const ordered = [...slots].sort((a, b) => a.order - b.order);
  const idx = ordered.findIndex((s) => s.id === slot.id);
  let n = 1;
  for (let i = idx - 1; i >= 0; i--) {
    const s = ordered[i];
    if (!s) break;
    if (occ.teacher.has(key3(day, s.id, teacherId))) n++;
    else break;
  }
  return n;
}

function scoreCandidate(
  occ: Occ,
  slots: Slot[],
  c: Candidate,
  unit: Unit,
  batch: Batch,
  roomCap: number,
  batchSize: number,
): number {
  let score = 0;
  if (c.preferredTeacher) score += 40;
  else if (c.listed) score += 16;
  else score -= 8;
  if (c.preferredSlot) score += 10;
  if (c.preferredDay) score += 6;
  const dayCount = occ.batchDay.get(key2(c.day, unit.batchId)) ?? 0;
  score += 8 - dayCount * 2;
  const cons = consecutiveCount(occ, slots, c.day, c.slot, c.teacher.id);
  if (cons <= 2) score += 5;
  else score -= 12;
  if (batchSize <= roomCap) score += 4;
  else score -= 6;
  if (batch.minStart && c.slot.start === batch.minStart) score += 2;
  const teacherDay = occ.teacherDay.get(key2(c.day, c.teacher.id)) ?? 0;
  score += 4 - teacherDay;
  const spread = occ.subjectDay.has(key3(c.day, unit.batchId, unit.subjectId));
  if (spread) score -= 20;
  return score;
}

function operatingDaysFor(data: AppData, versionId: string): DayKey[] {
  const v = data.routineVersions.find((x) => x.id === versionId);
  if (v?.operatingDays?.length) return v.operatingDays;
  if (v?.kind === "exam") return ["sat", "sun", "mon", "tue", "wed", "thu"];
  return CLASS_DAYS;
}

function teachersForSubject(
  teachers: Teacher[],
  subjectId: string,
  policy: CapabilityPolicy,
  preferredId: string | null,
): Teacher[] {
  const active = teachers.filter((t) => t.status === "active");
  const capable = active.filter((t) => t.subjectIds.includes(subjectId) || t.id === preferredId);
  if (policy === "hard") return capable;
  if (capable.length === 0 || policy === "ignore") return active;
  return capable;
}

function buildCandidates(
  data: AppData,
  unit: Omit<Unit, "candidates">,
  days: DayKey[],
  policy: CapabilityPolicy,
): Candidate[] {
  const batch = data.batches.find((b) => b.id === unit.batchId);
  if (!batch) return [];
  const slots = [...data.slots].sort((a, b) => a.order - b.order);
  const teachers = teachersForSubject(data.teachers, unit.subjectId, policy, unit.preferredTeacherId);
  const out: Candidate[] = [];
  for (const day of days) {
    for (const slot of slots) {
      if (!slotOk(batch, slot)) continue;
      for (const teacher of teachers) {
        if (unavailable(teacher, day, slot.id)) continue;
        const listed = teacher.subjectIds.includes(unit.subjectId);
        for (const room of data.rooms) {
          out.push({
            day,
            slot,
            teacher,
            roomId: room.id,
            listed,
            preferredTeacher: unit.preferredTeacherId === teacher.id,
            preferredSlot: teacher.preferredSlotIds?.includes(slot.id) ?? false,
            preferredDay: teacher.preferredDays?.includes(day) ?? false,
          });
        }
      }
    }
  }
  return out;
}

function explainUnit(
  data: AppData,
  unit: Omit<Unit, "candidates">,
  days: DayKey[],
  occ: Occ,
  overlap: Set<string>,
  policy: CapabilityPolicy,
): { reasons: string[]; relaxHints: string[] } {
  const batch = data.batches.find((b) => b.id === unit.batchId);
  const subject = data.subjects.find((s) => s.id === unit.subjectId);
  const reasons: string[] = [];
  const relaxHints: string[] = [];
  if (!batch || !subject) {
    return { reasons: ["Batch or subject is missing from master data."], relaxHints: [] };
  }
  const label = `${batch.name} · ${subject.name}`;
  const capable = data.teachers.filter((t) => t.status === "active" && t.subjectIds.includes(unit.subjectId));
  if (capable.length === 0) {
    reasons.push(`${label}: no teacher is listed for this subject.`);
    relaxHints.push("Assign a teacher to this subject, or set capability to Warn so another teacher may cover.");
  }
  const usableSlots = data.slots.filter((s) => slotOk(batch, s));
  if (usableSlots.length === 0) {
    reasons.push(`${label}: every period starts before this batch is allowed (${batch.minStart ?? "—"}).`);
    relaxHints.push("Lower the earliest-start rule for this batch, or add a later period.");
  }
  let anyTeacherFree = false;
  let anyRoomFree = false;
  let blockedSameDay = 0;
  let blockedMaxDay = 0;
  let blockedUnavail = 0;
  const daysLeft = days.filter((d) => (occ.batchDay.get(key2(d, batch.id)) ?? 0) < batchMaxDay(batch));
  if (daysLeft.length === 0) {
    reasons.push(`${label}: every operating day already has ${batchMaxDay(batch)} classes for this batch.`);
    relaxHints.push("Raise the daily class cap for this batch, or drop another subject this week.");
  }
  for (const day of days) {
    for (const slot of usableSlots) {
      for (const teacher of data.teachers.filter((t) => t.status === "active")) {
        if (unavailable(teacher, day, slot.id)) {
          blockedUnavail++;
          continue;
        }
        if (policy === "hard" && !teacher.subjectIds.includes(unit.subjectId)) continue;
        for (const room of data.rooms) {
          const fake: Candidate = {
            day,
            slot,
            teacher,
            roomId: room.id,
            listed: teacher.subjectIds.includes(unit.subjectId),
            preferredTeacher: false,
            preferredSlot: false,
            preferredDay: false,
          };
          const block = hardBlocked(occ, fake, unit, batch, overlap);
          if (!block) {
            anyTeacherFree = true;
            anyRoomFree = true;
          } else if (block === "same-subject") blockedSameDay++;
          else if (block === "batch-day") blockedMaxDay++;
          else if (block === "teacher") anyTeacherFree = anyTeacherFree || false;
          else if (block === "room") anyRoomFree = anyRoomFree || false;
        }
      }
    }
  }
  if (!anyTeacherFree) {
    reasons.push(`${label}: every capable teacher is already booked in the remaining legal slots.`);
    relaxHints.push("Free a teacher slot, raise weekly load, or allow a substitute teacher.");
  }
  if (!anyRoomFree) {
    reasons.push(`${label}: no room is free when a teacher is free.`);
    relaxHints.push("Add a room, or move a pinned class.");
  }
  if (blockedSameDay > 0) {
    reasons.push(`${label}: same subject is already placed on the only remaining days.`);
    relaxHints.push("Allow this subject twice on one day (owner rule is off by default).");
  }
  if (blockedMaxDay > 0 && daysLeft.length === 0) {
    /* already covered */
  }
  if (batch.minStart) {
    reasons.push(`${label}: cannot start before ${batch.minStart} (${batch.name} rule).`);
  }
  if (blockedUnavail > 0) {
    reasons.push(`${label}: teacher unavailability removed ${blockedUnavail} candidate cells.`);
  }
  if (reasons.length === 0) {
    reasons.push(`${label}: remaining legal cells were taken by higher-priority classes.`);
    relaxHints.push("Unpin a blocking class, or reduce another batch's weekly load.");
  }
  return { reasons: Array.from(new Set(reasons)).slice(0, 5), relaxHints: Array.from(new Set(relaxHints)).slice(0, 4) };
}

export function clashesFor(
  data: Pick<AppData, "routineEntries" | "teachers" | "rooms" | "batches" | "slots" | "students">,
  entry: Omit<RoutineEntry, "id" | "versionId" | "pinned">,
  ignoreId?: string,
): string[] {
  const list = data.routineEntries.filter((e) => e.id !== ignoreId);
  const msgs: string[] = [];
  if (list.some((e) => e.day === entry.day && e.slotId === entry.slotId && e.teacherId === entry.teacherId))
    msgs.push("Teacher is already in another class at this time.");
  const mine = data.batches.find((b) => b.id === entry.batchId);
  const g = mine?.shareGroup?.trim();
  const roomHits = list.filter((e) => e.day === entry.day && e.slotId === entry.slotId && e.roomId === entry.roomId);
  if (
    roomHits.some((hit) => {
      const other = data.batches.find((b) => b.id === hit.batchId);
      return !g || g !== other?.shareGroup?.trim();
    })
  ) {
    msgs.push("Room is already used at this time.");
  }
  if (list.some((e) => e.day === entry.day && e.slotId === entry.slotId && e.batchId === entry.batchId))
    msgs.push("This batch already has a class in this slot.");
  if (list.some((e) => e.day === entry.day && e.batchId === entry.batchId && e.subjectId === entry.subjectId))
    msgs.push("Same subject would appear twice today.");
  const batch = data.batches.find((b) => b.id === entry.batchId);
  const slot = data.slots.find((s) => s.id === entry.slotId);
  if (batch && slot && !slotOk(batch, slot))
    msgs.push(`${batch.name} should not start before ${batch.minStart}.`);
  const teacher = data.teachers.find((t) => t.id === entry.teacherId);
  if (teacher && unavailable(teacher, entry.day, entry.slotId))
    msgs.push(`${teacher.name} is marked unavailable in this slot.`);
  const dayCount = list.filter((e) => e.day === entry.day && e.batchId === entry.batchId).length;
  if (batch && dayCount >= batchMaxDay(batch))
    msgs.push(`${batch.name} already has ${batchMaxDay(batch)} classes on this day.`);
  const overlap = overlappingBatchPairs(data);
  for (const other of list.filter((e) => e.day === entry.day && e.slotId === entry.slotId)) {
    if (overlap.has(pairKey(entry.batchId, other.batchId)))
      msgs.push("Shared students would sit two classes at once.");
  }
  return msgs;
}

export function fitsInSlot(
  data: AppData,
  day: DayKey,
  slotId: string,
  versionId: string,
): FitOption[] {
  const slot = data.slots.find((s) => s.id === slotId);
  if (!slot) return [];
  const current = data.routineEntries.filter((e) => e.versionId === versionId);
  const share = new Map(data.batches.map((b) => [b.id, b.shareGroup?.trim() ?? ""]));
  const occ = emptyOcc(share);
  for (const e of current) occupyEntry(occ, e);
  const overlap = overlappingBatchPairs(data);
  const needs = remainingNeeds(data, versionId);
  const out: FitOption[] = [];
  const days = operatingDaysFor(data, versionId);
  const fridayBlocked = !days.includes(day) && day === "fri";
  if (fridayBlocked) return [];

  for (const batch of data.batches) {
    if (!slotOk(batch, slot)) continue;
    if (occ.batch.has(key3(day, slotId, batch.id))) continue;
    if ((occ.batchDay.get(key2(day, batch.id)) ?? 0) >= batchMaxDay(batch)) continue;
    const subjects = data.subjects.filter((s) => s.gradeKey === batch.gradeKey);
    for (const subject of subjects) {
      if (occ.subjectDay.has(key3(day, batch.id, subject.id))) continue;
      const others = occ.slotBatches.get(key2(day, slotId)) ?? [];
      if (others.some((ob) => overlap.has(pairKey(batch.id, ob)))) continue;
      for (const teacher of data.teachers.filter((t) => t.status === "active")) {
        if (occ.teacher.has(key3(day, slotId, teacher.id))) continue;
        if (unavailable(teacher, day, slotId)) continue;
        if ((occ.teacherDay.get(key2(day, teacher.id)) ?? 0) >= teacherMaxDay(teacher)) continue;
        if ((occ.teacherWeek.get(teacher.id) ?? 0) >= teacher.maxPerWeek) continue;
        for (const room of data.rooms) {
          if (roomClash(occ, day, slotId, room.id, batch.id)) continue;
          const warnings: string[] = [];
          if (!teacher.subjectIds.includes(subject.id))
            warnings.push(`${teacher.name} is not listed for ${subject.name}`);
          const size = data.students.filter(
            (s) => s.status === "active" && s.batchIds.includes(batch.id),
          ).length;
          if (size > room.capacity) warnings.push(`${room.name} capacity ${room.capacity} < ${size}`);
          const fillsNeed = (needs.get(key2(batch.id, subject.id)) ?? 0) > 0;
          out.push({
            batchId: batch.id,
            subjectId: subject.id,
            teacherId: teacher.id,
            roomId: room.id,
            warnings,
            fillsNeed,
          });
        }
      }
    }
  }
  return out
    .sort((a, b) => Number(b.fillsNeed) - Number(a.fillsNeed) || a.warnings.length - b.warnings.length)
    .slice(0, 36);
}

export function remainingNeeds(data: AppData, versionId: string): Map<string, number> {
  const map = new Map<string, number>();
  const reqs = (data.routineRequirements ?? []).filter((r) => r.versionId === versionId);
  const demands = reqs.length ? reqs : defaultDemands(data, versionId);
  for (const d of demands) {
    map.set(key2(d.batchId, d.subjectId), d.perWeek);
  }
  for (const e of data.routineEntries.filter((x) => x.versionId === versionId)) {
    const k = key2(e.batchId, e.subjectId);
    map.set(k, Math.max(0, (map.get(k) ?? 0) - 1));
  }
  return map;
}

export function defaultDemands(data: AppData, versionId?: string): Demand[] {
  const vid = versionId ?? data.routineVersions.find((v) => v.status === "published")?.id;
  const stored = (data.routineRequirements ?? []).filter((r) => !vid || r.versionId === vid);
  if (stored.length) {
    return stored.map((r) => ({
      id: r.id,
      batchId: r.batchId,
      subjectId: r.subjectId,
      perWeek: r.perWeek,
      preferredTeacherId: r.preferredTeacherId,
      allowSameDay: r.allowSameDay,
    }));
  }
  const out: Demand[] = [];
  for (const batch of data.batches) {
    const subs = data.subjects.filter((s) => s.gradeKey === batch.gradeKey);
    for (const s of subs) {
      out.push({ batchId: batch.id, subjectId: s.id, perWeek: 2 });
    }
  }
  return out;
}

export function seedRequirements(versionId: string): RoutineRequirement[] {
  const rows: [string, string, number, string | null][] = [
    ["b-35", "s-35-ban", 2, "t-farzana"],
    ["b-35", "s-35-eng", 2, "t-karim"],
    ["b-35", "s-35-mat", 3, "t-imran"],
    ["b-35", "s-35-sci", 2, "t-hasan"],
    ["b-35", "s-35-bgs", 1, "t-sultana"],
    ["b-6", "s-6-ban", 2, "t-farzana"],
    ["b-6", "s-6-eng", 2, "t-karim"],
    ["b-6", "s-6-mat", 3, "t-imran"],
    ["b-6", "s-6-sci", 2, "t-hasan"],
    ["b-6", "s-6-ict", 1, "t-tania"],
    ["b-7", "s-7-ban", 2, "t-farzana"],
    ["b-7", "s-7-eng", 2, "t-karim"],
    ["b-7", "s-7-mat", 3, "t-imran"],
    ["b-7", "s-7-sci", 2, "t-hasan"],
    ["b-7", "s-7-ict", 1, "t-tania"],
    ["b-9c", "s-9-acc", 3, "t-nabila"],
    ["b-9c", "s-9-bus", 2, "t-nabila"],
    ["b-9c", "s-9-fin", 2, "t-tania"],
    ["b-9c", "s-9-eng", 2, "t-karim"],
    ["b-10s", "s-10-phy", 3, "t-rahman"],
    ["b-10s", "s-10-che", 3, "t-hasan"],
    ["b-10s", "s-10-bio", 2, "t-sultana"],
    ["b-10s", "s-10-hm", 2, "t-imran"],
    ["b-10s", "s-10-eng", 2, "t-karim"],
    ["b-10s", "s-10-ict", 1, "t-tania"],
  ];
  return rows.map(([batchId, subjectId, perWeek, teacher], i) => ({
    id: `rq-${i + 1}`,
    versionId,
    batchId,
    subjectId,
    perWeek,
    preferredTeacherId: teacher,
    allowSameDay: false,
  }));
}

function pinConflicts(data: AppData, pins: RoutineEntry[]): HardConflict[] {
  const out: HardConflict[] = [];
  const seenT = new Map<string, string>();
  const seenR = new Map<string, string>();
  const seenB = new Map<string, string>();
  for (const e of pins) {
    const tk = key3(e.day, e.slotId, e.teacherId);
    const rk = key3(e.day, e.slotId, e.roomId);
    const bk = key3(e.day, e.slotId, e.batchId);
    const tPrev = seenT.get(tk);
    if (tPrev) out.push({ kind: "teacher", message: "Pinned classes put the same teacher in two rooms.", entryIds: [tPrev, e.id] });
    else seenT.set(tk, e.id);
    const rPrev = seenR.get(rk);
    if (rPrev) {
      const prev = pins.find((p) => p.id === rPrev);
      const ga = data.batches.find((b) => b.id === e.batchId)?.shareGroup?.trim();
      const gb = data.batches.find((b) => b.id === prev?.batchId)?.shareGroup?.trim();
      if (!ga || ga !== gb) {
        out.push({ kind: "room", message: "Pinned classes put two groups in the same room.", entryIds: [rPrev, e.id] });
      }
    } else seenR.set(rk, e.id);
    const bPrev = seenB.get(bk);
    if (bPrev) out.push({ kind: "batch", message: "Pinned classes overlap the same batch.", entryIds: [bPrev, e.id] });
    else seenB.set(bk, e.id);
    const batch = data.batches.find((b) => b.id === e.batchId);
    const slot = data.slots.find((s) => s.id === e.slotId);
    if (batch && slot && !slotOk(batch, slot)) {
      out.push({
        kind: "hours",
        message: `Pinned ${batch.name} starts before ${batch.minStart}.`,
        entryIds: [e.id],
      });
    }
    const teacher = data.teachers.find((t) => t.id === e.teacherId);
    if (teacher && unavailable(teacher, e.day, e.slotId)) {
      out.push({
        kind: "unavailable",
        message: `Pinned class uses ${teacher.name} in an unavailable slot.`,
        entryIds: [e.id],
      });
    }
  }
  return out;
}

export function generateRoutine(
  data: AppData,
  versionId: string,
  demands: Demand[],
  pinned: RoutineEntry[] = [],
  opts?: { policy?: CapabilityPolicy; timeBudgetMs?: number },
): GenerateResult {
  const policy = opts?.policy ?? "warning";
  const budget = opts?.timeBudgetMs ?? 700;
  const started = Date.now();
  const days = operatingDaysFor(data, versionId);
  const overlap = overlappingBatchPairs(data);
  const pins = pinned.map((p) => ({ ...p, versionId, pinned: true }));
  const hardConflicts = pinConflicts(data, pins);
  const share = new Map(data.batches.map((b) => [b.id, b.shareGroup?.trim() ?? ""]));
  const occ = emptyOcc(share);
  for (const p of pins) occupyEntry(occ, p);

  const warnings: string[] = [];
  const unplaced: Unplaced[] = [];
  const slots = [...data.slots].sort((a, b) => a.order - b.order);

  const units: Unit[] = [];
  for (const d of demands) {
    if (d.perWeek <= 0) continue;
    for (let i = 0; i < d.perWeek; i++) {
      const base = {
        id: `${d.id ?? `${d.batchId}-${d.subjectId}`}-${i}`,
        reqId: d.id ?? `${d.batchId}-${d.subjectId}`,
        batchId: d.batchId,
        subjectId: d.subjectId,
        preferredTeacherId: d.preferredTeacherId ?? null,
        allowSameDay: d.allowSameDay ?? false,
      };
      units.push({ ...base, candidates: buildCandidates(data, base, days, policy) });
    }
  }

  const already = new Map<string, number>();
  for (const p of pins) {
    const k = key2(p.batchId, p.subjectId);
    already.set(k, (already.get(k) ?? 0) + 1);
  }
  const filtered: Unit[] = [];
  const skipCount = new Map<string, number>();
  for (const u of units) {
    const k = key2(u.batchId, u.subjectId);
    const have = already.get(k) ?? 0;
    const skipped = skipCount.get(k) ?? 0;
    if (skipped < have) {
      skipCount.set(k, skipped + 1);
      continue;
    }
    filtered.push(u);
  }

  type Place = { unit: Unit; cand: Candidate };
  const path: Place[] = [];
  let bestPath: Place[] = [];
  let bestSkip: Unplaced[] = [];
  let nodes = 0;
  let timedOut = false;
  const roomCap = (id: string) => data.rooms.find((r) => r.id === id)?.capacity ?? 0;
  const batchSize = (id: string) =>
    data.students.filter((s) => s.status === "active" && s.batchIds.includes(id)).length;
  const skipBuf: Unplaced[] = [];

  const live = (u: Unit, o: Occ) => {
    const batch = data.batches.find((b) => b.id === u.batchId);
    if (!batch) return [] as { cand: Candidate; score: number }[];
    const liveC: { cand: Candidate; score: number }[] = [];
    for (const c of u.candidates) {
      if (hardBlocked(o, c, u, batch, overlap)) continue;
      liveC.push({
        cand: c,
        score: scoreCandidate(o, slots, c, u, batch, roomCap(c.roomId), batchSize(u.batchId)),
      });
    }
    liveC.sort(
      (a, b) =>
        b.score - a.score ||
        a.cand.day.localeCompare(b.cand.day) ||
        a.cand.slot.order - b.cand.slot.order ||
        a.cand.teacher.id.localeCompare(b.cand.teacher.id) ||
        a.cand.roomId.localeCompare(b.cand.roomId),
    );
    return liveC;
  };

  function remember() {
    if (path.length > bestPath.length) {
      bestPath = path.slice();
      bestSkip = skipBuf.slice();
    }
  }

  function search(open: Unit[], o: Occ) {
    nodes++;
    if (Date.now() - started > budget) {
      timedOut = true;
      remember();
      return;
    }
    if (path.length + open.length <= bestPath.length) return;
    if (open.length === 0) {
      remember();
      return;
    }
    let bestIdx = 0;
    let bestN = Infinity;
    for (let i = 0; i < open.length; i++) {
      const n = live(open[i]!, o).length;
      if (n < bestN) {
        bestN = n;
        bestIdx = i;
      }
    }
    const unit = open[bestIdx]!;
    const rest = open.filter((_, i) => i !== bestIdx);
    if (bestN === 0) {
      const exp = explainUnit(data, unit, days, o, overlap, policy);
      skipBuf.push({
        batchId: unit.batchId,
        subjectId: unit.subjectId,
        reasons: exp.reasons,
        relaxHints: exp.relaxHints,
      });
      search(rest, o);
      skipBuf.pop();
      return;
    }
    const options = live(unit, o);
    const cap = Math.min(options.length, 8);
    for (let i = 0; i < cap; i++) {
      const { cand } = options[i]!;
      const next = cloneOcc(o);
      occupy(next, cand, unit.batchId, unit.subjectId);
      path.push({ unit, cand });
      search(rest, next);
      path.pop();
      if (timedOut) return;
      if (bestPath.length === filtered.length) return;
    }
  }

  const impossible: Unit[] = [];
  const solvable: Unit[] = [];
  for (const u of filtered) {
    const batch = data.batches.find((b) => b.id === u.batchId);
    if (!batch || u.candidates.length === 0) {
      impossible.push(u);
      continue;
    }
    const any = u.candidates.some((c) => !hardBlocked(occ, c, u, batch, overlap));
    if (!any) impossible.push(u);
    else solvable.push(u);
  }
  for (const u of impossible) {
    const exp = explainUnit(data, u, days, occ, overlap, policy);
    unplaced.push({ batchId: u.batchId, subjectId: u.subjectId, reasons: exp.reasons, relaxHints: exp.relaxHints });
  }

  solvable.sort((a, b) => a.candidates.length - b.candidates.length || a.batchId.localeCompare(b.batchId) || a.subjectId.localeCompare(b.subjectId));
  search(solvable, occ);

  const generated: RoutineEntry[] = bestPath.map(({ unit, cand }) => {
    if (!cand.listed) {
      warnings.push(`${cand.teacher.name} is covering a subject not on their capability list.`);
    }
    const size = batchSize(unit.batchId);
    const cap = roomCap(cand.roomId);
    if (size > cap) warnings.push(`Room ${data.rooms.find((r) => r.id === cand.roomId)?.name ?? cand.roomId} is over capacity.`);
    return {
      id: `re-${versionId}-${unit.id}-${cand.day}-${cand.slot.id}`,
      versionId,
      day: cand.day,
      slotId: cand.slot.id,
      batchId: unit.batchId,
      subjectId: unit.subjectId,
      teacherId: cand.teacher.id,
      roomId: cand.roomId,
      pinned: false,
    };
  });

  unplaced.push(...bestSkip);
  const score = generated.length * 20 - unplaced.length * 15 - hardConflicts.length * 50;

  return {
    entries: [...pins, ...generated],
    warnings: Array.from(new Set(warnings)),
    unplaced,
    hardConflicts,
    score,
    placed: generated.length + pins.length,
    demanded: units.length,
    nodes,
    timedOut,
  };
}

export function entriesForDate(data: AppData, dateISO: string, day: DayKey): RoutineEntry[] {
  const published = data.routineVersions.find((v) => v.status === "published");
  if (!published) return [];
  const base = data.routineEntries.filter((e) => e.versionId === published.id && e.day === day);
  const ovs = data.overrides.filter((o) => o.date === dateISO);
  const cancelled = new Set(ovs.filter((o) => o.type === "cancel").map((o) => o.entryId));
  const replaced = new Map(ovs.filter((o) => o.type === "replace").map((o) => [o.entryId, o] as const));
  const movedAway = new Set(ovs.filter((o) => o.type === "move").map((o) => o.entryId));
  return base
    .filter((e) => !cancelled.has(e.id) && !movedAway.has(e.id))
    .map((e) => {
      const r = replaced.get(e.id);
      if (!r) return e;
      return {
        ...e,
        teacherId: r.newTeacherId ?? e.teacherId,
        slotId: r.newSlotId ?? e.slotId,
        roomId: r.newRoomId ?? e.roomId,
      };
    });
}

export function makeDraftId(): string {
  return nid("rv");
}

export function validateNoHardConflicts(
  entries: RoutineEntry[],
  batches: Pick<Batch, "id" | "shareGroup">[] = [],
): string[] {
  const share = new Map(batches.map((b) => [b.id, b.shareGroup?.trim() ?? ""]));
  const msgs: string[] = [];
  const t = new Set<string>();
  const bset = new Set<string>();
  const roomWho = new Map<string, string[]>();
  for (const e of entries) {
    const tk = key3(e.day, e.slotId, e.teacherId);
    const rk = key3(e.day, e.slotId, e.roomId);
    const bk = key3(e.day, e.slotId, e.batchId);
    if (t.has(tk)) msgs.push(`Teacher clash ${e.day} ${e.slotId} ${e.teacherId}`);
    const who = roomWho.get(rk) ?? [];
    if (who.length > 0) {
      const g = share.get(e.batchId) ?? "";
      const clash = !g || who.some((id) => (share.get(id) ?? "") !== g);
      if (clash) msgs.push(`Room clash ${e.day} ${e.slotId} ${e.roomId}`);
    }
    if (bset.has(bk)) msgs.push(`Batch clash ${e.day} ${e.slotId} ${e.batchId}`);
    t.add(tk);
    bset.add(bk);
    roomWho.set(rk, [...who, e.batchId]);
  }
  return msgs;
}
