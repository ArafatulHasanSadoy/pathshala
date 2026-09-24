import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/pathshala/avatar";
import { CollectForm } from "@/components/pathshala/collect-dialog";
import { ReceiptView } from "@/components/pathshala/receipt";
import { Slip } from "@/components/pathshala/slip";
import { useApp } from "@/lib/pathshala/store";
import { dueStudents, monthCollection, studentDue } from "@/lib/pathshala/fees";
import { money, monthISO, prettyDate, prettyMonth, telHref, waHref } from "@/lib/pathshala/format";
import { t } from "@/lib/pathshala/i18n";
import type { Student } from "@/lib/pathshala/types";

export const Route = createFileRoute("/_app/fees")({ component: FeesPage });

function FeesPage() {
  const data = useApp();
  const lang = data.settings.lang;
  const [tab, setTab] = useState<"dues" | "collect" | "receipts">("dues");
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<Student | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const ym = monthISO();
  const dues = dueStudents(data);
  const students = useMemo(() => {
    const n = q.trim().toLowerCase();
    return data.students.filter((s) => s.status === "active").filter((s) => {
      if (!n) return true;
      return `${s.name} ${s.code} ${s.phone} ${s.guardianPhone}`.toLowerCase().includes(n);
    });
  }, [data.students, q]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {(["dues", "collect", "receipts"] as const).map((k) => (
          <Button key={k} size="sm" variant={tab === k ? "stamp" : "outline"} onClick={() => setTab(k)}>
            {k === "dues" ? t(lang, "dues") : k === "collect" ? t(lang, "collect") : t(lang, "receipts")}
          </Button>
        ))}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const n = data.generateMonthFees(ym);
            toast.success(`${n} invoices · ${prettyMonth(ym)}`);
          }}
        >
          {t(lang, "generateMonth")} · {prettyMonth(ym)}
        </Button>
      </div>
      <p className="text-sm text-muted">
        {t(lang, "thisMonth")} {money(monthCollection(data, ym), lang)} · {t(lang, "dueBy")}
      </p>

      {tab === "dues" ? (
        <div className="flex flex-col gap-2">
          {dues.map(({ student, due }) => (
            <Slip key={student.id}>
              <div className="flex items-start gap-3">
                <Avatar name={student.name} hue={student.avatarHue} />
                <div className="min-w-0 flex-1">
                  <Link to="/students/$id" params={{ id: student.id }} className="font-medium">
                    {student.name}
                  </Link>
                  <p className="text-xs text-muted">{student.code}</p>
                  <p className="mt-1 font-display text-xl tabular-nums text-rust">{money(due, lang)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={telHref(student.guardianPhone)}>
                  <Button size="sm" variant="ghost">{t(lang, "call")}</Button>
                </a>
                <a href={waHref(student.guardianPhone, `${student.name} dues ${money(due)}`)} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="ghost">{t(lang, "whatsapp")}</Button>
                </a>
                <Button size="sm" onClick={() => setPick(student)}>{t(lang, "quickCollect")}</Button>
              </div>
            </Slip>
          ))}
          {dues.length === 0 ? <Slip>{t(lang, "emptyActions")}</Slip> : null}
        </div>
      ) : null}

      {tab === "collect" ? (
        <div className="flex flex-col gap-3">
          <Input placeholder={t(lang, "lookUp")} value={q} onChange={(e) => setQ(e.target.value)} />
          {students.map((s) => (
            <Slip key={s.id} className="flex items-center gap-3" onClick={() => setPick(s)} as="button">
              <Avatar name={s.name} hue={s.avatarHue} size="sm" />
              <span className="flex-1 text-left">
                {s.name}
                <span className="block text-xs text-muted">{s.code}</span>
              </span>
              <span className="tabular-nums text-sm">{money(studentDue(data, s.id), lang)}</span>
            </Slip>
          ))}
        </div>
      ) : null}

      {tab === "receipts" ? (
        <div className="flex flex-col gap-2">
          {data.payments.slice(0, 40).map((p) => {
            const st = data.students.find((s) => s.id === p.studentId);
            return (
              <Slip key={p.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{p.receiptNo}</p>
                    <p className="text-xs text-muted">
                      {st?.name} · {prettyDate(p.at.slice(0, 10))} · {p.method}
                      {p.voided ? " · VOID" : ""}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums font-medium">{money(p.amount, lang)}</span>
                </div>
                <Button className="mt-2" size="sm" variant="outline" onClick={() => setReceipt(p.id)}>
                  {t(lang, "reprint")}
                </Button>
              </Slip>
            );
          })}
        </div>
      ) : null}

      <Dialog open={!!pick} onOpenChange={() => setPick(null)}>
        <DialogContent title={pick ? pick.name : t(lang, "collect")}>
          {pick ? <CollectForm student={pick} onDone={() => setPick(null)} /> : null}
        </DialogContent>
      </Dialog>
      <Dialog open={!!receipt} onOpenChange={() => setReceipt(null)}>
        <DialogContent title={t(lang, "receipt")}>
          {receipt ? <ReceiptView paymentId={receipt} onClose={() => setReceipt(null)} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
