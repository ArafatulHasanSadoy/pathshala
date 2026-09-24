import assert from "node:assert/strict";
import { test } from "node:test";
import { seedAdvanceEducare } from "./seed.ts";
import {
  generateRoutine,
  seedRequirements,
  validateNoHardConflicts,
  clashesFor,
} from "./routine.ts";
import type { AppData, RoutineEntry } from "./types.ts";

function data(): AppData {
  return seedAdvanceEducare();
}

test("seed routine has no hard teacher/room/batch clashes", () => {
  const d = data();
  const msgs = validateNoHardConflicts(d.routineEntries, d.batches);
  assert.deepEqual(msgs, []);
});

test("class 3-5 never starts before 5:00 PM", () => {
  const d = data();
  const early = d.slots.filter((s) => s.start < "17:00").map((s) => s.id);
  const bad = d.routineEntries.filter((e) => e.batchId === "b-35" && early.includes(e.slotId) && e.day !== "sat");
  assert.equal(bad.length, 0);
});

test("class 6 never starts before 6:00 PM", () => {
  const d = data();
  const early = d.slots.filter((s) => s.start < "18:00").map((s) => s.id);
  const bad = d.routineEntries.filter((e) => e.batchId === "b-6" && early.includes(e.slotId));
  assert.equal(bad.length, 0);
});

test("friday is empty for the regular week", () => {
  const d = data();
  assert.equal(d.routineEntries.filter((e) => e.day === "fri").length, 0);
});

test("same subject is not placed twice on the same day for a batch", () => {
  const d = data();
  const seen = new Set<string>();
  for (const e of d.routineEntries.filter((x) => x.day !== "sat")) {
    const k = `${e.day}|${e.batchId}|${e.subjectId}`;
    assert.equal(seen.has(k), false, k);
    seen.add(k);
  }
});

test("pinned saturday classes survive regeneration", () => {
  const d = data();
  const pins = d.routineEntries.filter((e) => e.pinned);
  assert.ok(pins.some((p) => p.id === "re-sat-eng"));
  const result = generateRoutine(
    d,
    "rv-sep",
    seedRequirements("rv-sep").map((r) => ({
      id: r.id,
      batchId: r.batchId,
      subjectId: r.subjectId,
      perWeek: r.perWeek,
      preferredTeacherId: r.preferredTeacherId,
      allowSameDay: r.allowSameDay,
    })),
    pins,
    { timeBudgetMs: 900 },
  );
  assert.ok(result.entries.some((e) => e.id === "re-sat-eng" && e.pinned));
  assert.ok(result.entries.some((e) => e.id === "re-sat-acc" && e.pinned));
});

test("unpin means a stale pin is not re-injected", () => {
  const d = data();
  const pins = d.routineEntries.filter((e) => e.pinned && e.id !== "re-sat-eng");
  const result = generateRoutine(
    d,
    "rv-sep",
    seedRequirements("rv-sep").map((r) => ({
      id: r.id,
      batchId: r.batchId,
      subjectId: r.subjectId,
      perWeek: r.perWeek,
      preferredTeacherId: r.preferredTeacherId,
      allowSameDay: r.allowSameDay,
    })),
    pins,
    { timeBudgetMs: 900 },
  );
  assert.equal(
    result.entries.some((e) => e.id === "re-sat-eng"),
    false,
  );
});

test("generation is deterministic", () => {
  const d = data();
  const reqs = seedRequirements("rv-sep").map((r) => ({
    id: r.id,
    batchId: r.batchId,
    subjectId: r.subjectId,
    perWeek: r.perWeek,
    preferredTeacherId: r.preferredTeacherId,
    allowSameDay: r.allowSameDay,
  }));
  const a = generateRoutine(d, "rv-sep", reqs, [], { timeBudgetMs: 900 });
  const b = generateRoutine(d, "rv-sep", reqs, [], { timeBudgetMs: 900 });
  const sig = (entries: RoutineEntry[]) =>
    entries
      .map((e) => `${e.day}|${e.slotId}|${e.batchId}|${e.subjectId}|${e.teacherId}|${e.roomId}`)
      .sort()
      .join("\n");
  assert.equal(sig(a.entries), sig(b.entries));
});

test("unplaced items explain the blocking rule", () => {
  const d = data();
  const reqs = [
    {
      id: "rq-over",
      batchId: "b-6",
      subjectId: "s-6-mat",
      perWeek: 20,
      preferredTeacherId: "t-imran",
      allowSameDay: false,
    },
  ];
  const result = generateRoutine(d, "rv-sep", reqs, [], { timeBudgetMs: 400 });
  assert.ok(result.unplaced.length > 0);
  assert.ok(result.unplaced[0]!.reasons.length > 0);
});

test("manual clash detector catches teacher double booking", () => {
  const d = data();
  const e = d.routineEntries.find((x) => x.day === "sun");
  assert.ok(e);
  const clash = clashesFor(d, { ...e });
  assert.ok(clash.length > 0);
});

test("solver never violates hard constraints even if coverage is partial", () => {
  const d = data();
  const result = generateRoutine(
    d,
    "rv-sep",
    seedRequirements("rv-sep").map((r) => ({
      id: r.id,
      batchId: r.batchId,
      subjectId: r.subjectId,
      perWeek: r.perWeek,
      preferredTeacherId: r.preferredTeacherId,
      allowSameDay: r.allowSameDay,
    })),
    [],
    { timeBudgetMs: 900 },
  );
  assert.deepEqual(validateNoHardConflicts(result.entries, d.batches), []);
  assert.ok(result.placed >= 40, `expected most of ~52 classes, placed ${result.placed}`);
});

test("same share group may sit in one room; different groups still clash", () => {
  const d = data();
  const base = {
    versionId: "rv-sep",
    day: "sun" as const,
    slotId: "p3",
    roomId: "r-a",
    pinned: false,
  };
  const a = { ...base, id: "x1", batchId: "b-6", subjectId: "s-6-mat", teacherId: "t-imran" };
  const b = { ...base, id: "x2", batchId: "b-7", subjectId: "s-7-mat", teacherId: "t-hasan" };
  assert.deepEqual(validateNoHardConflicts([a, b], d.batches), []);
  const junior = { ...b, id: "x3", batchId: "b-35", subjectId: "s-6-mat", teacherId: "t-rahman" };
  assert.ok(validateNoHardConflicts([a, junior], d.batches).some((m) => m.startsWith("Room clash")));
  const exclusive = d.batches.map((row) => (row.id === "b-7" ? { ...row, shareGroup: null } : row));
  assert.ok(validateNoHardConflicts([a, b], exclusive).some((m) => m.startsWith("Room clash")));
});
