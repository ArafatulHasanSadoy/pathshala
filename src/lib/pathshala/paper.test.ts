import assert from "node:assert/strict";
import { test } from "node:test";
import { correctOption, parseQuestionDump, seededShuffle, shufflePaperSet } from "./paper.ts";
import { seedAdvanceEducare } from "./seed.ts";

test("parse dump keeps MCQ option identity separate from display index", () => {
  const qs = parseQuestionDump(`1. The synonym of rapid is —
A. slow
B. quick
C. late
D. idle

2. Stem: Rina plants trees. [10]
(a) What is afforestation? [1]
(b) Why does she plant trees? [2]`);
  assert.equal(qs.length, 2);
  assert.equal(qs[0]!.type, "mcq");
  assert.equal(qs[0]!.options?.length, 4);
  assert.ok(qs[0]!.options![0]!.id);
  assert.notEqual(qs[0]!.options![0]!.id, qs[0]!.options![1]!.id);
  assert.equal(qs[1]!.type, "cq");
  assert.equal(qs[1]!.subs?.length, 2);
});

test("shuffled set keeps the correct option id even if A/B/C/D move", () => {
  const data = seedAdvanceEducare();
  const paper = data.papers[0]!;
  const original = paper.sections[0]!.questions[0]!;
  const rightId = original.correctOptionId;
  assert.ok(rightId);
  const setB = shufflePaperSet(paper, "B", 42);
  const setC = shufflePaperSet(paper, "C", 99);
  const qB = setB.sections[0]!.questions.find((q) => q.correctOptionId === rightId) ?? setB.sections[0]!.questions[0]!;
  const qC = setC.sections[0]!.questions.find((q) => q.correctOptionId === rightId) ?? setC.sections[0]!.questions[0]!;
  const b = correctOption(qB);
  const c = correctOption(qC);
  assert.equal(b?.id, rightId);
  assert.equal(c?.id, rightId);
  assert.equal(b?.text, "quick");
});

test("seeded shuffle is deterministic", () => {
  const a = seededShuffle(["w", "x", "y", "z"], 7).join("");
  const b = seededShuffle(["w", "x", "y", "z"], 7).join("");
  assert.equal(a, b);
});
