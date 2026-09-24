import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Slip } from "@/components/pathshala/slip";
import { useApp } from "@/lib/pathshala/store";
import { t } from "@/lib/pathshala/i18n";
import { openPrintWindow } from "@/components/pathshala/print";

export const Route = createFileRoute("/_app/exams")({ component: ExamsPage });

function ExamsPage() {
  const data = useApp();
  const lang = data.settings.lang;
  const [examId, setExamId] = useState(data.exams[0]?.id ?? "");
  const exam = data.exams.find((e) => e.id === examId);
  const roster = data.students.filter((s) => {
    if (!exam) return false;
    const batch = data.batches.find((b) => b.gradeKey === exam.gradeKey);
    return s.status === "active" && batch && s.batchIds.includes(batch.id);
  });
  const rows = roster
    .map((s) => {
      const mark = data.marks.find((m) => m.examId === examId && m.studentId === s.id);
      return { s, mark: mark?.marks ?? null, status: mark?.status ?? "sat" };
    })
    .sort((a, b) => (b.mark ?? -1) - (a.mark ?? -1));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{t(lang, "autoCalc")}</p>
      <Select value={examId} onChange={(e) => setExamId(e.target.value)}>
        {data.exams.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name} · {e.date}
          </option>
        ))}
      </Select>
      {exam ? (
        <>
          <Slip>
            <p className="font-display text-xl">{exam.name}</p>
            <p className="text-sm text-muted">
              {t(lang, "fullMarks")} {exam.fullMarks} · {exam.date}
            </p>
          </Slip>
          {rows.map((row, i) => (
            <Slip key={row.s.id} className="flex items-center gap-3">
              <span className="w-6 tabular-nums text-muted">{row.mark == null ? "—" : i + 1}</span>
              <span className="flex-1">{row.s.name}</span>
              <Input
                className="w-20"
                type="number"
                value={row.mark ?? ""}
                onChange={(e) =>
                  data.setMark(
                    exam.id,
                    row.s.id,
                    e.target.value === "" ? null : Number(e.target.value),
                    "sat",
                  )
                }
              />
              <span className="text-xs text-muted w-12">
                {row.mark == null ? "" : `${Math.round((row.mark / exam.fullMarks) * 100)}%`}
              </span>
            </Slip>
          ))}
          <Button
            variant="outline"
            onClick={() => {
              const html = `<div>
                <h1>${data.coaching.name}</h1>
                <h2>${exam.name} — Merit list</h2>
                <ol>${rows
                  .filter((r) => r.mark != null)
                  .map((r) => `<li>${r.s.name} — ${r.mark}/${exam.fullMarks}</li>`)
                  .join("")}</ol>
              </div>`;
              data.rememberPrint("result", exam.name, html);
              openPrintWindow(html, exam.name);
            }}
          >
            {t(lang, "merit")}
          </Button>
        </>
      ) : null}
      <NewExam />
    </div>
  );
}

function NewExam() {
  const data = useApp();
  const lang = data.settings.lang;
  const [name, setName] = useState("Weekly test");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [batch, setBatch] = useState(data.batches[0]?.id ?? "");
  const [subject, setSubject] = useState(data.subjects[0]?.id ?? "");
  const [full, setFull] = useState("20");
  const b = data.batches.find((x) => x.id === batch);
  return (
    <Slip>
      <p className="font-medium mb-2">{lang === "bn" ? "নতুন পরীক্ষা" : "New exam"}</p>
      <div className="grid gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select value={batch} onChange={(e) => setBatch(e.target.value)}>
          {data.batches.map((x) => (
            <option key={x.id} value={x.id}>{x.name}</option>
          ))}
        </Select>
        <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
          {data.subjects.filter((s) => !b || s.gradeKey === b.gradeKey).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
        <Label>{t(lang, "fullMarks")}</Label>
        <Input type="number" value={full} onChange={(e) => setFull(e.target.value)} />
        <Button
          variant="secondary"
          onClick={() => {
            if (!b) return;
            data.addExam(name, date, b.gradeKey, subject, Number(full) || 20);
          }}
        >
          {t(lang, "add")}
        </Button>
      </div>
    </Slip>
  );
}
