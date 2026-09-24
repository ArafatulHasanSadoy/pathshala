import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Avatar } from "@/components/pathshala/avatar";
import { CollectButton } from "@/components/pathshala/collect-dialog";
import { Slip } from "@/components/pathshala/slip";
import { useApp } from "@/lib/pathshala/store";
import { invoiceBalance, lastPayment, openInvoicesOldest, studentDue } from "@/lib/pathshala/fees";
import { openPrintWindow } from "@/components/pathshala/print";
import { admissionHtml } from "@/lib/pathshala/paper";
import { ATT_EN, money, prettyDate, prettyMonth, telHref, waHref } from "@/lib/pathshala/format";
import { t } from "@/lib/pathshala/i18n";
import { attendancePct } from "@/lib/pathshala/selectors";

export const Route = createFileRoute("/_app/students/$id")({ component: Profile });

function Profile() {
  const { id } = Route.useParams();
  const data = useApp();
  const lang = data.settings.lang;
  const s = data.students.find((x) => x.id === id);
  const [note, setNote] = useState("");
  const [batchId, setBatchId] = useState(s?.batchIds[0] ?? "");
  const [promiseAmt, setPromiseAmt] = useState("");
  const [promiseDate, setPromiseDate] = useState("");

  if (!s) return <p>{t(lang, "noStudents")}</p>;

  const due = studentDue(data, s.id);
  const last = lastPayment(data, s.id);
  const batch = data.batches.find((b) => b.id === s.batchIds[0]);
  const pct = attendancePct(data, s.id);
  const invoices = data.invoices.filter((i) => i.studentId === s.id);
  const pays = data.payments.filter((p) => p.studentId === s.id);
  const notes = data.notes.filter((n) => n.studentId === s.id);
  const marks = data.marks.filter((m) => m.studentId === s.id);
  const abs = data.attendance
    .flatMap((a) => a.records.filter((r) => r.studentId === s.id && r.status === "absent").map((r) => ({ date: a.date, ...r })))
    .slice(0, 8);
  const msg = lang === "bn"
    ? `সালাম, ${s.name}-এর বকেয়া ${money(due)}। Advance Educare।`
    : `Salam, ${s.name} has dues of ${money(due)} at Advance Educare.`;

  return (
    <div className="flex flex-col gap-5">
      <Slip className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar name={s.name} hue={s.avatarHue} photo={s.photoData} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-3xl tracking-tight">{lang === "bn" ? s.nameBn : s.name}</h2>
            {due > 0 ? <Badge tone="rust">{t(lang, "due")} {money(due, lang)}</Badge> : <Badge tone="ok">{t(lang, "paid")}</Badge>}
            <Badge>{s.status}</Badge>
          </div>
          <p className="text-sm text-muted mt-1">
            {s.code} · {batch?.name} · Class {s.grade} {s.group !== "none" ? s.group : ""} · {s.school}
          </p>
          <p className="text-sm mt-1">
            {t(lang, "guardian")}: {s.guardianName} · {s.guardianPhone}
          </p>
          <p className="text-sm tabular-nums">
            {t(lang, "monthly")} {money(s.monthlyFee, lang)} · {t(lang, "lastPay")}{" "}
            {last ? prettyDate(last.at.slice(0, 10)) : "—"} · {t(lang, "attendance")} {pct}%
          </p>
        </div>
      </Slip>

      <div className="flex flex-wrap gap-2">
        <CollectButton student={s} />
        <a href={telHref(s.guardianPhone)}>
          <Button variant="outline" size="sm">
            <Phone className="size-3.5" /> {t(lang, "call")}
          </Button>
        </a>
        <a href={waHref(s.guardianPhone, msg)} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm">{t(lang, "whatsapp")}</Button>
        </a>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            openPrintWindow(idCardHtml(s, data.coaching.name, batch?.name ?? ""), `${s.code}-id`)
          }
        >
          {t(lang, "idCard")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const html = admissionHtml({
              coaching: data.coaching,
              name: s.name,
              code: s.code,
              grade: s.grade,
              group: s.group,
              school: s.school,
              phone: s.phone,
              guardian: s.guardianName,
              guardianPhone: s.guardianPhone,
              batch: batch?.name ?? "",
              monthly: money(s.monthlyFee, lang),
              admissionFee: money(s.admissionFee, lang),
              date: s.admissionDate,
              address: s.address,
            });
            data.rememberPrint("admission", `${s.code} admission`, html);
            openPrintWindow(html, `${s.code}-admission`);
          }}
        >
          {t(lang, "printAdmission")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => data.updateStudent(s.id, { status: s.status === "dropped" ? "active" : "dropped" })}
        >
          {s.status === "dropped" ? t(lang, "active") : t(lang, "markDropped")}
        </Button>
      </div>

      <section>
        <h3 className="font-display text-xl mb-2">{t(lang, "dues")}</h3>
        <Slip>
          {openInvoicesOldest(data, s.id).map((inv) => (
            <div key={inv.id} className="flex justify-between py-1 text-sm">
              <span>{inv.month ? prettyMonth(inv.month) : inv.title}</span>
              <span className="tabular-nums">{money(invoiceBalance(inv, data.payments), lang)}</span>
            </div>
          ))}
          {openInvoicesOldest(data, s.id).length === 0 ? <p className="text-sm text-muted">{t(lang, "paid")}</p> : null}
        </Slip>
      </section>

      <section>
        <h3 className="font-display text-xl mb-2">{t(lang, "history")}</h3>
        <Slip className="flex flex-col gap-2">
          {pays.slice(0, 8).map((p) => (
            <div key={p.id} className="text-sm">
              <div className="flex justify-between">
                <span>
                  {p.receiptNo} · {prettyDate(p.at.slice(0, 10))} {p.voided ? "(void)" : ""}
                </span>
                <span className="tabular-nums">{money(p.amount, lang)}</span>
              </div>
              <p className="text-xs text-muted">
                {t(lang, "allocation")}:{" "}
                {p.allocations
                  .map((a) => {
                    const inv = invoices.find((i) => i.id === a.invoiceId);
                    return inv?.month ? prettyMonth(inv.month) : inv?.title;
                  })
                  .filter(Boolean)
                  .join(", ") || "—"}
                {p.credit ? ` · credit ${money(p.credit, lang)}` : ""}
              </p>
            </div>
          ))}
          {invoices.slice(0, 1).length === 0 && pays.length === 0 ? <p className="text-sm text-muted">—</p> : null}
        </Slip>
      </section>

      <section>
        <h3 className="font-display text-xl mb-2">{t(lang, "attendance")}</h3>
        <Slip>
          <p className="text-sm mb-2">{pct}% · {abs.length} recent absences</p>
          {abs.map((a) => (
            <p key={a.date} className="text-sm text-muted">
              {prettyDate(a.date)} · {ATT_EN[a.status]} {a.reason ? `· ${a.reason}` : ""}
            </p>
          ))}
        </Slip>
      </section>

      <section>
        <h3 className="font-display text-xl mb-2">{t(lang, "results")}</h3>
        <Slip>
          {marks.length === 0 ? <p className="text-sm text-muted">—</p> : null}
          {marks.map((m) => {
            const ex = data.exams.find((e) => e.id === m.examId);
            return (
              <p key={`${m.examId}-${m.studentId}`} className="text-sm">
                {ex?.name} · {m.marks ?? "—"} / {ex?.fullMarks} ({m.status})
              </p>
            );
          })}
        </Slip>
      </section>

      <section>
        <h3 className="font-display text-xl mb-2">{t(lang, "promisePay")}</h3>
        <Slip className="flex flex-col gap-2">
          {data.promises
            .filter((p) => p.studentId === s.id)
            .map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>
                  {money(p.amount, lang)} · {prettyDate(p.date)} · {p.note}
                </span>
                {p.done ? (
                  <Badge tone="ok">{t(lang, "done")}</Badge>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => data.completePromise(p.id)}>
                    {t(lang, "done")}
                  </Button>
                )}
              </div>
            ))}
          <div className="grid gap-2 sm:grid-cols-3">
            <Input type="number" placeholder={t(lang, "amount")} value={promiseAmt} onChange={(e) => setPromiseAmt(e.target.value)} />
            <Input type="date" value={promiseDate} onChange={(e) => setPromiseDate(e.target.value)} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!promiseAmt || !promiseDate) return;
                data.addPromise(s.id, Number(promiseAmt), promiseDate, "Owner note");
                setPromiseAmt("");
              }}
            >
              {t(lang, "add")}
            </Button>
          </div>
        </Slip>
      </section>

      <section>
        <h3 className="font-display text-xl mb-2">{t(lang, "notes")}</h3>
        <div className="flex gap-2 mb-2">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t(lang, "saveNote")} />
          <Button
            size="sm"
            onClick={() => {
              if (!note.trim()) return;
              data.addNote(s.id, "other", note.trim());
              setNote("");
            }}
          >
            {t(lang, "add")}
          </Button>
        </div>
        {notes.map((n) => (
          <Slip key={n.id} className="mb-2">
            <p className="text-xs text-muted">
              {prettyDate(n.at.slice(0, 10))} · {n.kind}
            </p>
            <p className="text-sm">{n.text}</p>
          </Slip>
        ))}
      </section>

      <section>
        <h3 className="font-display text-xl mb-2">{t(lang, "transferBatch")}</h3>
        <div className="flex gap-2">
          <Select value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            {data.batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          <Button variant="outline" onClick={() => data.transferBatch(s.id, batchId, "Owner transfer")}>
            {t(lang, "apply")}
          </Button>
        </div>
      </section>

      <Link to="/students" className="text-sm text-teal">
        ← {t(lang, "students")}
      </Link>
    </div>
  );
}

function idCardHtml(s: { name: string; code: string; grade: string; school: string }, coaching: string, batch: string) {
  return `<div style="width:320px;height:200px;border:2px solid #1f6b5a;padding:16px;font-family:Georgia,serif;color:#1c2430">
    <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#1f6b5a">${coaching}</div>
    <div style="font-size:22px;margin-top:12px">${s.name}</div>
    <div style="font-size:13px;margin-top:8px">${s.code}<br/>Class ${s.grade} · ${batch}<br/>${s.school}</div>
    <div style="margin-top:16px;font-size:11px;color:#6d6458">Session 2026 · Student ID</div>
  </div>`;
}
