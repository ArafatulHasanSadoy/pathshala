import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Slip, Stat } from "@/components/pathshala/slip";
import { PrintPreview } from "@/components/pathshala/print-preview";
import { useApp } from "@/lib/pathshala/store";
import {
  accountBalance,
  monthCollection,
  monthExpense,
  monthNet,
  monthOtherIncome,
  monthSpendOnly,
  monthTeacherPay,
  totalDue,
} from "@/lib/pathshala/fees";
import { money, monthISO, prettyDate } from "@/lib/pathshala/format";
import { t } from "@/lib/pathshala/i18n";
import { todayISO } from "@/lib/pathshala/selectors";

export const Route = createFileRoute("/_app/finance")({ component: FinancePage });

function FinancePage() {
  const data = useApp();
  const lang = data.settings.lang;
  const [ym, setYm] = useState(monthISO());
  const today = todayISO();
  const feesIn = monthCollection(data, ym);
  const otherIn = monthOtherIncome(data, ym);
  const spend = monthSpendOnly(data, ym);
  const teacherPay = monthTeacherPay(data, ym);
  const exp = monthExpense(data, ym);
  const net = monthNet(data, ym);
  const [cat, setCat] = useState("Printing/stationery");
  const [otherWhat, setOtherWhat] = useState("");
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const [acc, setAcc] = useState("acc-cash");
  const [counted, setCounted] = useState("");
  const [incTitle, setIncTitle] = useState("");
  const [incAmt, setIncAmt] = useState("");
  const [printHtml, setPrintHtml] = useState<string | null>(null);

  const expected = accountBalance(data, "acc-cash");

  return (
    <div className="flex flex-col gap-4">
      <Input type="month" value={ym} onChange={(e) => setYm(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Stat label={t(lang, "feeIncome")} value={money(feesIn, lang)} tone="teal" />
        <Stat label={t(lang, "otherIncome")} value={money(otherIn, lang)} />
        <Stat label={t(lang, "monthSpend")} value={money(spend, lang)} />
        <Stat label={t(lang, "teacherPay")} value={money(teacherPay, lang)} />
        <Stat
          label={t(lang, "netProfit")}
          value={money(net, lang)}
          tone={net < 0 ? "rust" : "teal"}
          hint={net < 0 ? (lang === "bn" ? "ক্ষতি" : "Loss") : (lang === "bn" ? "লাভ" : "Profit")}
        />
        <Stat label={t(lang, "totalDue")} value={money(totalDue(data), lang)} tone="rust" />
      </div>

      <Slip>
        <p className="font-display text-xl mb-2">{t(lang, "accounts")}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.accounts.map((a) => (
            <div key={a.id}>
              <p className="text-xs text-muted">{a.name}</p>
              <p className="tabular-nums font-medium">{money(accountBalance(data, a.id), lang)}</p>
            </div>
          ))}
        </div>
      </Slip>

      <Slip>
        <p className="font-display text-xl mb-3">{t(lang, "addExpense")}</p>
        <div className="grid gap-2">
          <Select value={cat} onChange={(e) => setCat(e.target.value)}>
            {["Rent", "Teacher salary", "Electricity", "Printing/stationery", "Marketing", "Maintenance", "Transport", "Snacks", "Other"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          {cat === "Other" ? (
            <Input placeholder={t(lang, "otherDetail")} value={otherWhat} onChange={(e) => setOtherWhat(e.target.value)} />
          ) : null}
          <Input type="number" placeholder={t(lang, "amount")} value={amt} onChange={(e) => setAmt(e.target.value)} />
          <Select value={acc} onChange={(e) => setAcc(e.target.value)}>
            {data.accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
          <Input placeholder={t(lang, "notes")} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <Button
          className="mt-3"
          onClick={() => {
            if (!amt) return;
            const category = cat === "Other" ? (otherWhat.trim() || "Other") : cat;
            data.addExpense({ category, amount: Number(amt), accountId: acc, date: today, note });
            toast.success(t(lang, "save"));
            setAmt("");
            setNote("");
            setOtherWhat("");
          }}
        >
          {t(lang, "add")}
        </Button>
      </Slip>

      <Slip>
        <p className="font-display text-xl mb-3">{t(lang, "otherIncome")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder={lang === "bn" ? "বিবরণ" : "What for"} value={incTitle} onChange={(e) => setIncTitle(e.target.value)} />
          <Input type="number" placeholder={t(lang, "amount")} value={incAmt} onChange={(e) => setIncAmt(e.target.value)} />
        </div>
        <Button
          className="mt-3"
          variant="outline"
          onClick={() => {
            if (!incAmt || !incTitle.trim()) return;
            data.addIncome(incTitle.trim(), Number(incAmt), "acc-cash", today);
            setIncTitle("");
            setIncAmt("");
            toast.success(t(lang, "save"));
          }}
        >
          {t(lang, "add")}
        </Button>
      </Slip>

      <Slip>
        <p className="font-display text-xl mb-2">{t(lang, "closeDay")}</p>
        <p className="text-sm text-muted mb-2">
          {t(lang, "expectedCash")} {money(expected, lang)}
        </p>
        <Label>{t(lang, "countedCash")}</Label>
        <Input className="mt-1" type="number" value={counted} onChange={(e) => setCounted(e.target.value)} />
        <Button
          className="mt-3"
          variant="outline"
          onClick={() => {
            data.closeCash(today, expected, Number(counted) || expected, "Daily close");
            toast.success(t(lang, "save"));
          }}
        >
          {t(lang, "closeDay")}
        </Button>
      </Slip>

      <Slip>
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-xl">{t(lang, "monthEnd")}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const html = `<div>
                <h1>${data.coaching.name}</h1>
                <p>Month ${ym}</p>
                <p>Fee collection ${money(feesIn)}</p>
                <p>Other income ${money(otherIn)}</p>
                <p>Expenses ${money(spend)}</p>
                <p>Teacher pay ${money(teacherPay)}</p>
                <p><b>Net ${money(net)}</b></p>
                <p>Outstanding dues ${money(totalDue(data))}</p>
              </div>`;
              data.rememberPrint("finance", `Summary ${ym}`, html);
              setPrintHtml(html);
            }}
          >
            {t(lang, "print")}
          </Button>
        </div>
        <div className="mt-3 flex flex-col gap-1 text-sm">
          {data.expenses.filter((e) => e.date.startsWith(ym)).slice(0, 12).map((e) => (
            <div key={e.id} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">{prettyDate(e.date)} · {e.category}{e.note ? ` — ${e.note}` : ""}</span>
              <span className="shrink-0 tabular-nums">{money(e.amount, lang)}</span>
            </div>
          ))}
        </div>
      </Slip>
      {printHtml ? <PrintPreview html={printHtml} title={`Summary ${ym}`} onClose={() => setPrintHtml(null)} /> : null}
    </div>
  );
}
