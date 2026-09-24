import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/pathshala/store";
import { invoiceBalance } from "@/lib/pathshala/fees";
import { money, prettyDate, prettyMonth, METHOD_EN } from "@/lib/pathshala/format";
import { t } from "@/lib/pathshala/i18n";
import { openPrintWindow } from "./print";
import type { CoachingProfile, Payment, Student } from "@/lib/pathshala/types";
import type { Lang } from "@/lib/pathshala/types";

function receiptHtml(
  coaching: CoachingProfile,
  pay: Payment,
  student: Student,
  batchName: string,
  remaining: number,
  months: string,
  lang: Lang,
) {
  return `<div style="font-family:Georgia,serif;max-width:420px;margin:0 auto;padding:24px;border:1px solid #c4b8a6;color:#1c2430">
      <div style="text-align:center;border-bottom:1px dashed #c4b8a6;padding-bottom:12px">
        <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#1f6b5a">Receipt</div>
        <div style="font-size:22px;margin-top:4px">${coaching.name}</div>
        <div style="font-size:12px;color:#6d6458">${coaching.address} · ${coaching.phone}</div>
      </div>
      <p style="font-size:12px">No. <b>${pay.receiptNo}</b> · ${prettyDate(pay.at.slice(0, 10))}</p>
      <p><b>${student.name}</b> · ${student.code}<br/>${batchName} · ${student.school}</p>
      <p>Months: ${months || "—"}</p>
      <table style="width:100%;font-size:14px">
        <tr><td>Paid now</td><td style="text-align:right">${money(pay.amount)}</td></tr>
        <tr><td>Remaining due</td><td style="text-align:right">${money(remaining)}</td></tr>
        <tr><td>Method</td><td style="text-align:right">${METHOD_EN[pay.method]}${pay.reference ? " · " + pay.reference : ""}</td></tr>
      </table>
      ${pay.credit ? `<p>Credit held: ${money(pay.credit)}</p>` : ""}
      <p style="font-size:12px;color:#6d6458;margin-top:16px">${t(lang, "thanks")}</p>
      <div style="display:flex;justify-content:space-between;margin-top:36px;font-size:12px">
        <div style="border-top:1px solid #1c2430;padding-top:6px;width:40%">Seal</div>
        <div style="border-top:1px solid #1c2430;padding-top:6px;width:40%;text-align:right">Authorised signature</div>
      </div>
    </div>`;
}

export function ReceiptView({ paymentId, onClose }: { paymentId: string; onClose?: () => void }) {
  const data = useApp();
  const lang = data.settings.lang;
  const pay = data.payments.find((p) => p.id === paymentId);
  if (!pay) return null;
  const student = data.students.find((s) => s.id === pay.studentId);
  if (!student) return null;
  const batch = data.batches.find((b) => b.id === student.batchIds[0]);
  const remaining = data.invoices
    .filter((i) => i.studentId === student.id)
    .reduce((n, i) => n + invoiceBalance(i, data.payments), 0);
  const months = pay.allocations
    .map((a) => data.invoices.find((i) => i.id === a.invoiceId))
    .filter(Boolean)
    .map((i) => (i!.month ? prettyMonth(i!.month) : i!.title))
    .join(", ");

  const html = receiptHtml(data.coaching, pay, student, batch?.name ?? "", remaining, months, lang);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-dashed border-line-strong bg-paper p-4 print-sheet" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="flex flex-wrap gap-2 no-print">
        <Button
          onClick={() => {
            data.rememberPrint("receipt", pay.receiptNo, html);
            openPrintWindow(html, pay.receiptNo);
          }}
        >
          {t(lang, "print")}
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            if (navigator.share) {
              await navigator.share({ title: pay.receiptNo, text: `${student.name} · ${money(pay.amount)}` });
            } else {
              await navigator.clipboard.writeText(`${pay.receiptNo} ${student.name} ${money(pay.amount)}`);
            }
          }}
        >
          {t(lang, "share")}
        </Button>
        {onClose ? (
          <Button variant="ghost" onClick={onClose}>
            {t(lang, "done")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
