import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { useApp } from "@/lib/pathshala/store";
import { allocateOldest, invoiceBalance, openInvoicesOldest, studentDue } from "@/lib/pathshala/fees";
import { money, prettyMonth, METHOD_EN, METHOD_BN } from "@/lib/pathshala/format";
import { t } from "@/lib/pathshala/i18n";
import type { PayMethod, Student } from "@/lib/pathshala/types";
import { ReceiptView } from "./receipt";

export function CollectButton({ student, children }: { student: Student; children?: ReactNode }) {
  const lang = useApp((s) => s.settings.lang);
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{children ?? t(lang, "collect")}</Button>
      </DialogTrigger>
      <DialogContent title={t(lang, "collect")}>
        <CollectForm student={student} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function CollectForm({ student, onDone }: { student: Student; onDone?: () => void }) {
  const data = useApp();
  const lang = data.settings.lang;
  const due = studentDue(data, student.id);
  const open = openInvoicesOldest(data, student.id);
  const [amount, setAmount] = useState(String(due || student.monthlyFee));
  const [method, setMethod] = useState<PayMethod>("cash");
  const [reference, setReference] = useState("");
  const [overpay, setOverpay] = useState<"credit" | "future">("credit");
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const preview = useMemo(() => allocateOldest(data, student.id, Number(amount) || 0), [data, student.id, amount]);

  if (receiptId) {
    const pay = data.payments.find((p) => p.id === receiptId);
    if (pay) return <ReceiptView paymentId={receiptId} onClose={onDone} />;
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(amount);
        if (!n || n <= 0) return;
        const { paymentId } = data.collectFee({
          studentId: student.id,
          amount: n,
          method,
          reference,
          overpay,
        });
        toast.success(`${t(lang, "receipt")} ${data.payments[0]?.receiptNo ?? ""}`);
        setReceiptId(paymentId);
      }}
    >
      <p className="text-sm text-muted">
        {student.name} · {student.code} · {t(lang, "due")} {money(due, lang)}
      </p>
      <div className="rounded-md border border-line bg-paper-2 p-3 text-sm">
        {open.length === 0 ? (
          <p>{lang === "bn" ? "কোনো খোলা চালান নেই।" : "No open invoices."}</p>
        ) : (
          open.map((inv) => (
            <div key={inv.id} className="flex items-start justify-between gap-3 py-1">
              <span className="min-w-0 truncate">{inv.month ? prettyMonth(inv.month) : inv.title}</span>
              <span className="shrink-0 tabular-nums">{money(invoiceBalance(inv, data.payments), lang)}</span>
            </div>
          ))
        )}
      </div>
      <div>
        <Label>{t(lang, "amount")}</Label>
        <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>{t(lang, "method")}</Label>
        <Select value={method} onChange={(e) => setMethod(e.target.value as PayMethod)} className="mt-1">
          {Object.entries(lang === "bn" ? METHOD_BN : METHOD_EN).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      {method !== "cash" ? (
        <div>
          <Label>{t(lang, "reference")}</Label>
          <Input value={reference} onChange={(e) => setReference(e.target.value)} className="mt-1" />
        </div>
      ) : null}
      {preview.leftover > 0 ? (
        <div>
          <Label>{t(lang, "overpay")}</Label>
          <Select value={overpay} onChange={(e) => setOverpay(e.target.value as "credit" | "future")} className="mt-1">
            <option value="credit">{t(lang, "asCredit")}</option>
            <option value="future">{t(lang, "toFuture")}</option>
          </Select>
        </div>
      ) : null}
      <p className="text-xs text-muted">{t(lang, "oldestFirst")}</p>
      <Button type="submit">{t(lang, "confirm")}</Button>
    </form>
  );
}
