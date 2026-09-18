import assert from "node:assert/strict";
import { test } from "node:test";
import { allocateOldest, invoiceBalance } from "./fees.ts";
import { seedAdvanceEducare } from "./seed.ts";

test("TEST-001 oldest-first allocation: 3 x 2000, pay 5000", () => {
  const data = seedAdvanceEducare();
  const studentId = "alloc-st";
  data.students.push({
    ...data.students[0]!,
    id: studentId,
    code: "AE-26-099",
    name: "Allocation Case",
    nameBn: "অ্যালোকেশন",
    monthlyFee: 2000,
    status: "active",
  });
  data.invoices.push(
    { id: "inv-jun", studentId, kind: "tuition", month: "2026-06", title: "Tuition 2026-06", amount: 2000, dueDate: "2026-06-10", waived: false },
    { id: "inv-jul", studentId, kind: "tuition", month: "2026-07", title: "Tuition 2026-07", amount: 2000, dueDate: "2026-07-10", waived: false },
    { id: "inv-aug", studentId, kind: "tuition", month: "2026-08", title: "Tuition 2026-08", amount: 2000, dueDate: "2026-08-10", waived: false },
  );
  const { allocations, leftover } = allocateOldest(data, studentId, 5000);
  assert.equal(leftover, 0);
  assert.equal(allocations.length, 3);
  assert.equal(allocations[0]!.invoiceId, "inv-jun");
  assert.equal(allocations[0]!.amount, 2000);
  assert.equal(allocations[1]!.invoiceId, "inv-jul");
  assert.equal(allocations[1]!.amount, 2000);
  assert.equal(allocations[2]!.invoiceId, "inv-aug");
  assert.equal(allocations[2]!.amount, 1000);
  const fakePay = {
    id: "p", studentId, amount: 5000, method: "cash" as const, reference: "", at: "2026-09-01T10:00:00",
    receiptNo: "RCP-TEST", allocations, credit: 0, voided: false, note: "",
  };
  data.payments.push(fakePay);
  assert.equal(invoiceBalance(data.invoices.find((i) => i.id === "inv-jun")!, data.payments), 0);
  assert.equal(invoiceBalance(data.invoices.find((i) => i.id === "inv-jul")!, data.payments), 0);
  assert.equal(invoiceBalance(data.invoices.find((i) => i.id === "inv-aug")!, data.payments), 1000);
});
