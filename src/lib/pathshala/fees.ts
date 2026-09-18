import type { AppData, Invoice, Payment, Student } from "./types.ts";

export function invoiceBalance(inv: Invoice, payments: Payment[]): number {
  if (inv.waived) return 0;
  let paid = 0;
  for (const p of payments) {
    if (p.voided) continue;
    for (const a of p.allocations) {
      if (a.invoiceId === inv.id) paid += a.amount;
    }
  }
  return Math.max(0, inv.amount - paid);
}

export function studentInvoices(data: AppData, studentId: string): Invoice[] {
  return data.invoices.filter((i) => i.studentId === studentId);
}

export function studentPayments(data: AppData, studentId: string): Payment[] {
  return data.payments.filter((p) => p.studentId === studentId && !p.voided);
}

export function studentDue(data: AppData, studentId: string): number {
  const pays = data.payments;
  return studentInvoices(data, studentId).reduce((s, i) => s + invoiceBalance(i, pays), 0);
}

export function studentCredit(data: AppData, studentId: string): number {
  return studentPayments(data, studentId).reduce((s, p) => s + p.credit, 0);
}

export function lastPayment(data: AppData, studentId: string): Payment | undefined {
  return studentPayments(data, studentId).sort((a, b) => b.at.localeCompare(a.at))[0];
}

export function openInvoicesOldest(data: AppData, studentId: string): Invoice[] {
  const pays = data.payments;
  return studentInvoices(data, studentId)
    .filter((i) => invoiceBalance(i, pays) > 0)
    .sort((a, b) => (a.dueDate + (a.month ?? "")).localeCompare(b.dueDate + (b.month ?? "")));
}

export function allocateOldest(
  data: AppData,
  studentId: string,
  amount: number,
): { allocations: { invoiceId: string; amount: number }[]; leftover: number } {
  let left = amount;
  const allocations: { invoiceId: string; amount: number }[] = [];
  for (const inv of openInvoicesOldest(data, studentId)) {
    if (left <= 0) break;
    const bal = invoiceBalance(inv, data.payments);
    const take = Math.min(bal, left);
    if (take > 0) {
      allocations.push({ invoiceId: inv.id, amount: take });
      left -= take;
    }
  }
  return { allocations, leftover: left };
}

export function totalDue(data: AppData): number {
  return data.students
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + studentDue(data, s.id), 0);
}

export function collectedOn(data: AppData, date: string): number {
  return data.payments.filter((p) => !p.voided && p.at.slice(0, 10) === date).reduce((s, p) => s + p.amount, 0);
}

export function expensesOn(data: AppData, date: string): number {
  return data.expenses.filter((e) => e.date === date).reduce((s, e) => s + e.amount, 0);
}

export function accountBalance(data: AppData, accountId: string): number {
  let n = data.openingBalances[accountId] ?? 0;
  for (const p of data.payments) {
    if (p.voided) continue;
    if (accountForMethod(data, p.method) === accountId) n += p.amount;
  }
  for (const inc of data.otherIncome) if (inc.accountId === accountId) n += inc.amount;
  for (const e of data.expenses) if (e.accountId === accountId) n -= e.amount;
  for (const pay of data.payouts) if (pay) {
    if (accountId === "acc-cash") n -= pay.amount;
  }
  return n;
}

export function accountForMethod(data: AppData, method: string): string {
  const map: Record<string, string> = {
    cash: "acc-cash", bkash: "acc-bkash", nagad: "acc-nagad", bank: "acc-bank", card: "acc-bank", other: "acc-cash",
  };
  const id = map[method] ?? "acc-cash";
  return data.accounts.some((a) => a.id === id) ? id : data.accounts[0]?.id ?? "acc-cash";
}

export function monthCollection(data: AppData, ym: string): number {
  return data.payments.filter((p) => !p.voided && p.at.startsWith(ym)).reduce((s, p) => s + p.amount, 0);
}

export function monthExpense(data: AppData, ym: string): number {
  const exp = data.expenses.filter((e) => e.date.startsWith(ym)).reduce((s, e) => s + e.amount, 0);
  const pay = data.payouts.filter((e) => e.date.startsWith(ym)).reduce((s, e) => s + e.amount, 0);
  return exp + pay;
}

export function monthOtherIncome(data: AppData, ym: string): number {
  return data.otherIncome.filter((e) => e.date.startsWith(ym)).reduce((s, e) => s + e.amount, 0);
}

export function monthSpendOnly(data: AppData, ym: string): number {
  return data.expenses.filter((e) => e.date.startsWith(ym)).reduce((s, e) => s + e.amount, 0);
}

export function monthTeacherPay(data: AppData, ym: string): number {
  return data.payouts.filter((e) => e.month === ym || e.date.startsWith(ym)).reduce((s, e) => s + e.amount, 0);
}

export function monthNet(data: AppData, ym: string): number {
  return monthCollection(data, ym) + monthOtherIncome(data, ym) - monthExpense(data, ym);
}

export function feeTitle(inv: Invoice): string {
  if (inv.kind === "tuition" && inv.month) return inv.title;
  return inv.title;
}

export function dueStudents(data: AppData): { student: Student; due: number }[] {
  return data.students
    .filter((s) => s.status === "active")
    .map((student) => ({ student, due: studentDue(data, student.id) }))
    .filter((x) => x.due > 0)
    .sort((a, b) => b.due - a.due);
}
