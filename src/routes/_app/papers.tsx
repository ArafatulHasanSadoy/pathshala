import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Camera, Library, Printer, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Slip } from "@/components/pathshala/slip";
import { useApp } from "@/lib/pathshala/store";
import { nid } from "@/lib/pathshala/ids";
import { t } from "@/lib/pathshala/i18n";
import {
  answerKeyHtml,
  fileToJpegDataUrl,
  paperHtml,
  paperMarks,
  parseQuestionDump,
  shufflePaperSet,
} from "@/lib/pathshala/paper";
import type { Paper, PaperQuestion, PaperSection } from "@/lib/pathshala/types";
import { PrintPreview } from "@/components/pathshala/print-preview";

export const Route = createFileRoute("/_app/papers")({ component: PapersPage });

function PapersPage() {
  const data = useApp();
  const lang = data.settings.lang;
  const [id, setId] = useState(data.papers[0]?.id ?? "");
  const [tab, setTab] = useState<"compose" | "bank" | "scan">("compose");
  const paper = data.papers.find((p) => p.id === id);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{t(lang, "paperLead")}</p>
      <div className="flex flex-wrap gap-2">
        {data.papers.map((p) => (
          <Button key={p.id} size="sm" variant={id === p.id ? "stamp" : "outline"} onClick={() => setId(p.id)}>
            {p.title}
          </Button>
        ))}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const p: Paper = {
              id: nid("paper"),
              title: lang === "bn" ? "নতুন প্রশ্নপত্র" : "New paper",
              examName: "Weekly test",
              gradeKey: data.batches[0]?.gradeKey ?? "10",
              subjectId: data.subjects[0]?.id ?? "",
              date: new Date().toISOString().slice(0, 10),
              durationMin: 90,
              fullMarks: 100,
              setLabel: "A",
              instructions: "Answer all questions. Figures in the right margin indicate full marks.",
              sections: [{ id: nid("sec"), title: "Section A", instruction: "", questions: [] }],
              status: "draft",
              updatedAt: new Date().toISOString(),
              scans: [],
            };
            data.savePaper(p);
            setId(p.id);
          }}
        >
          {t(lang, "add")}
        </Button>
      </div>
      <div className="flex gap-1">
        {(["compose", "scan", "bank"] as const).map((k) => (
          <Button key={k} size="sm" variant={tab === k ? "stamp" : "outline"} onClick={() => setTab(k)}>
            {k === "compose" ? t(lang, "composePaper") : k === "scan" ? t(lang, "scanDesk") : t(lang, "bank")}
          </Button>
        ))}
      </div>
      {!paper ? <p className="text-sm text-muted">{t(lang, "nothing")}</p> : null}
      {paper && tab === "compose" ? <Editor paper={paper} /> : null}
      {paper && tab === "scan" ? <ScanDesk paper={paper} /> : null}
      {paper && tab === "bank" ? <BankPanel paper={paper} /> : null}
    </div>
  );
}

function Editor({ paper }: { paper: Paper }) {
  const data = useApp();
  const lang = data.settings.lang;
  const [dump, setDump] = useState("");
  const [preview, setPreview] = useState<{ html: string; title: string } | null>(null);
  const total = paperMarks(paper);
  const warn = total !== paper.fullMarks;

  function patch(next: Paper) {
    data.savePaper({ ...next, updatedAt: new Date().toISOString() });
  }

  function addQ(sectionId: string, fromBank?: PaperQuestion) {
    const section = paper.sections.find((s) => s.id === sectionId);
    const q: PaperQuestion = fromBank ?? {
      id: nid("pq"),
      number: String((section?.questions.length ?? 0) + 1),
      text: "",
      marks: 1,
      type: "short",
    };
    patch({
      ...paper,
      sections: paper.sections.map((s) =>
        s.id === sectionId ? { ...s, questions: [...s.questions, q] } : s,
      ),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Slip>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label={lang === "bn" ? "শিরোনাম" : "Title"} value={paper.title} on={(v) => patch({ ...paper, title: v })} />
          <Field label={lang === "bn" ? "পরীক্ষা" : "Exam"} value={paper.examName} on={(v) => patch({ ...paper, examName: v })} />
          <Field label={lang === "bn" ? "তারিখ" : "Date"} value={paper.date} on={(v) => patch({ ...paper, date: v })} />
          <Field label="Set" value={paper.setLabel} on={(v) => patch({ ...paper, setLabel: v })} />
          <Field label={t(lang, "fullMarks")} value={String(paper.fullMarks)} on={(v) => patch({ ...paper, fullMarks: Number(v) || 0 })} />
          <Field label={lang === "bn" ? "মিনিট" : "Minutes"} value={String(paper.durationMin)} on={(v) => patch({ ...paper, durationMin: Number(v) || 0 })} />
        </div>
        <Label className="mt-2 block">{lang === "bn" ? "নির্দেশনা" : "Instructions"}</Label>
        <Textarea className="mt-1" value={paper.instructions} onChange={(e) => patch({ ...paper, instructions: e.target.value })} />
        <p className="mt-2 text-sm">
          {t(lang, "totalMarks")} <span className="tabular-nums font-medium">{total}</span> / {paper.fullMarks}
          {warn ? <Badge tone="amber" className="ml-2">{t(lang, "warning")}</Badge> : <Badge tone="ok" className="ml-2">OK</Badge>}
        </p>
      </Slip>

      <Slip>
        <p className="font-medium">{t(lang, "composePaper")}</p>
        <p className="text-xs text-muted mt-1">{t(lang, "composeHint")}</p>
        <Textarea
          className="mt-2 min-h-32"
          value={dump}
          onChange={(e) => setDump(e.target.value)}
          placeholder={"1. The synonym of rapid is —\nA. slow\nB. quick\nC. late\nD. idle\n\n2. Stem: Rina plants trees. [10]\n(a) What is afforestation? [1]"}
        />
        <Button
          className="mt-2"
          size="sm"
          onClick={() => {
            const qs = parseQuestionDump(dump);
            if (!qs.length) {
              toast.error(lang === "bn" ? "কোনো প্রশ্ন পাওয়া যায়নি।" : "No questions found in that text.");
              return;
            }
            const target = paper.sections[0];
            if (!target) return;
            patch({
              ...paper,
              sections: paper.sections.map((s) =>
                s.id === target.id ? { ...s, questions: [...s.questions, ...qs] } : s,
              ),
            });
            setDump("");
            toast.success(`${qs.length}`);
          }}
        >
          {t(lang, "turnIntoPaper")}
        </Button>
      </Slip>

      {paper.sections.map((sec) => (
        <SectionEditor
          key={sec.id}
          paper={paper}
          section={sec}
          onChange={(s) => patch({ ...paper, sections: paper.sections.map((x) => (x.id === s.id ? s : x)) })}
          onAddQ={() => addQ(sec.id)}
          onFromBank={(q) => addQ(sec.id, q)}
        />
      ))}

      <Button
        variant="outline"
        onClick={() =>
          patch({
            ...paper,
            sections: [
              ...paper.sections,
              {
                id: nid("sec"),
                title: `Section ${String.fromCharCode(65 + paper.sections.length)}`,
                instruction: "",
                questions: [],
              },
            ],
          })
        }
      >
        {t(lang, "section")}
      </Button>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            const html = paperHtml(paper, data.coaching);
            data.rememberPrint("paper", paper.title, html);
            setPreview({ html, title: paper.title });
            patch({ ...paper, status: "ready" });
          }}
        >
          <Printer className="size-4" /> {t(lang, "paperPreview")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            const html = answerKeyHtml(paper, data.coaching);
            data.rememberPrint("key", `${paper.title} key`, html);
            setPreview({ html, title: `${paper.title} key` });
          }}
        >
          <KeyRound className="size-4" /> {t(lang, "answerKey")}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const nextSet = String.fromCharCode((paper.setLabel.charCodeAt(0) || 65) + 1);
            const seed = nextSet.charCodeAt(0) * 17 + paper.sections.length;
            const copy = shufflePaperSet(paper, nextSet, seed);
            data.savePaper(copy);
            toast.success(`Set ${nextSet}`);
          }}
        >
          {t(lang, "shuffleSet")}
        </Button>
      </div>
      {preview ? <PrintPreview html={preview.html} title={preview.title} onClose={() => setPreview(null)} /> : null}
    </div>
  );
}

function ScanDesk({ paper }: { paper: Paper }) {
  const data = useApp();
  const lang = data.settings.lang;
  const [image, setImage] = useState<string | null>(paper.scans?.[0]?.imageData ?? null);
  const [note, setNote] = useState("");
  const [text, setText] = useState("");

  async function onFile(file: File) {
    const imageData = await fileToJpegDataUrl(file);
    setImage(imageData);
    data.savePaper({
      ...paper,
      scans: [...(paper.scans ?? []), { id: nid("scan"), imageData, note: "" }],
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Slip>
        <p className="font-medium">{t(lang, "scanDesk")}</p>
        <p className="text-sm text-muted mt-1">{t(lang, "scanHint")}</p>
        <label className="mt-3 flex h-12 items-center justify-center rounded-md border border-dashed border-line text-sm text-teal">
          <Camera className="size-4 mr-2" />
          {t(lang, "attachPhoto")}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </label>
      </Slip>
      {image ? (
        <Slip>
          <img src={image} alt="" className="max-h-64 w-full rounded-md border border-line object-contain" />
          <Label className="mt-3 block">{t(lang, "transcribe")}</Label>
          <Textarea
            className="mt-1 min-h-32"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t(lang, "composeHint")}
          />
          <Input className="mt-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder={lang === "bn" ? "পাতার নোট" : "Page note"} />
          <Button
            className="mt-2"
            onClick={() => {
              const qs = parseQuestionDump(text);
              const withImg = qs.length
                ? qs.map((q, i) => (i === 0 ? { ...q, imageData: image } : q))
                : [
                    {
                      id: nid("pq"),
                      number: "1",
                      text: text || note || (lang === "bn" ? "স্ক্যান করা প্রশ্ন" : "Scanned question"),
                      marks: 1,
                      type: "short" as const,
                      imageData: image,
                    },
                  ];
              const target = paper.sections[0] ?? { id: nid("sec"), title: "Section A", instruction: "", questions: [] };
              const sections = paper.sections.length
                ? paper.sections.map((s, i) => (i === 0 ? { ...s, questions: [...s.questions, ...withImg] } : s))
                : [{ ...target, questions: withImg }];
              data.savePaper({ ...paper, sections, updatedAt: new Date().toISOString() });
              setText("");
              toast.success(t(lang, "turnIntoPaper"));
            }}
          >
            {t(lang, "turnIntoPaper")}
          </Button>
        </Slip>
      ) : null}
    </div>
  );
}

function BankPanel({ paper }: { paper: Paper }) {
  const data = useApp();
  const lang = data.settings.lang;
  const [chapter, setChapter] = useState("");
  const [text, setText] = useState("");
  const [type, setType] = useState<PaperQuestion["type"]>("mcq");
  const bank = data.bank.filter((q) => !chapter || q.chapter.toLowerCase().includes(chapter.toLowerCase()));

  return (
    <div className="flex flex-col gap-3">
      <Slip>
        <p className="font-medium">{t(lang, "bank")}</p>
        <Input className="mt-2" placeholder={lang === "bn" ? "অধ্যায় খুঁজুন" : "Filter by chapter"} value={chapter} onChange={(e) => setChapter(e.target.value)} />
        <div className="mt-3 flex flex-col gap-2">
          {bank.map((q) => (
            <button
              key={q.id}
              type="button"
              className="rounded-md border border-line p-3 text-left text-sm hover:bg-paper-2"
              onClick={() => {
                const target = paper.sections[0];
                if (!target) return;
                const pq: PaperQuestion = {
                  id: nid("pq"),
                  bankId: q.id,
                  number: String(target.questions.length + 1),
                  text: q.text,
                  marks: q.marks,
                  type: q.type,
                  options: q.options,
                  correctOptionId: q.correctOptionId,
                  answer: q.answer,
                };
                data.savePaper({
                  ...paper,
                  sections: paper.sections.map((s) =>
                    s.id === target.id ? { ...s, questions: [...s.questions, pq] } : s,
                  ),
                  updatedAt: new Date().toISOString(),
                });
                toast.success(t(lang, "fromBank"));
              }}
            >
              <Badge tone="muted">{q.type}</Badge> <span className="text-muted">{q.chapter}</span>
              <p className="mt-1">{q.text}</p>
            </button>
          ))}
        </div>
      </Slip>
      <Slip>
        <p className="font-medium">{t(lang, "addQuestion")}</p>
        <Select value={type} onChange={(e) => setType(e.target.value as PaperQuestion["type"])}>
          <option value="mcq">MCQ</option>
          <option value="cq">CQ</option>
          <option value="short">Short</option>
          <option value="blank">Fill blank</option>
        </Select>
        <Textarea className="mt-2" value={text} onChange={(e) => setText(e.target.value)} />
        <Button
          className="mt-2"
          size="sm"
          onClick={() => {
            if (!text.trim()) return;
            data.addBankQuestion({
              gradeKey: paper.gradeKey,
              subjectId: paper.subjectId,
              chapter: chapter || "General",
              topic: "",
              type,
              difficulty: "mid",
              marks: type === "cq" ? 10 : 1,
              text,
              answer: "",
            });
            setText("");
            toast.success(t(lang, "save"));
          }}
        >
          <Library className="size-4" /> {t(lang, "save")}
        </Button>
      </Slip>
    </div>
  );
}

function SectionEditor({
  paper,
  section,
  onChange,
  onAddQ,
  onFromBank,
}: {
  paper: Paper;
  section: PaperSection;
  onChange: (s: PaperSection) => void;
  onAddQ: () => void;
  onFromBank: (q: PaperQuestion) => void;
}) {
  const data = useApp();
  const lang = data.settings.lang;
  const bank = data.bank.filter((q) => q.subjectId === paper.subjectId || q.gradeKey === paper.gradeKey);
  return (
    <Slip>
      <Input value={section.title} onChange={(e) => onChange({ ...section, title: e.target.value })} />
      <Input
        className="mt-2"
        placeholder="Instruction / answer any N"
        value={section.instruction}
        onChange={(e) => onChange({ ...section, instruction: e.target.value })}
      />
      <div className="mt-3 flex flex-col gap-3">
        {section.questions.map((q, i) => (
          <div key={q.id} className="rounded-md border border-line p-3">
            <div className="flex gap-2">
              <Input className="w-16" value={q.number} onChange={(e) => onChange(replaceQ(section, i, { ...q, number: e.target.value }))} />
              <Input
                className="w-20"
                type="number"
                value={q.marks}
                onChange={(e) => onChange(replaceQ(section, i, { ...q, marks: Number(e.target.value) }))}
              />
            </div>
            <Textarea className="mt-2" value={q.text} onChange={(e) => onChange(replaceQ(section, i, { ...q, text: e.target.value }))} />
            {q.imageData ? (
              <img src={q.imageData} alt="" className="mt-2 max-h-40 rounded-sm border border-line object-contain" />
            ) : null}
            <label className="mt-2 inline-flex h-11 items-center text-sm text-teal">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const imageData = await fileToJpegDataUrl(file);
                  onChange(replaceQ(section, i, { ...q, imageData }));
                }}
              />
              {t(lang, "attachPhoto")}
            </label>
            {q.options?.map((opt) => (
              <div key={opt.id} className="mt-1 flex gap-2">
                <span className="w-6 text-sm">{opt.key}</span>
                <Input
                  value={opt.text}
                  onChange={(e) => {
                    const options = q.options!.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o));
                    onChange(replaceQ(section, i, { ...q, options }));
                  }}
                />
              </div>
            ))}
            {q.subs?.map((sub) => (
              <div key={sub.label} className="mt-2 pl-3 text-sm">
                <span className="text-muted">({sub.label})</span> {sub.text}{" "}
                <span className="text-muted">[{sub.marks}]</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onAddQ}>
          {t(lang, "typeDirect")}
        </Button>
        <Select
          onChange={(e) => {
            const bq = data.bank.find((x) => x.id === e.target.value);
            if (!bq) return;
            onFromBank({
              id: nid("pq"),
              bankId: bq.id,
              number: String(section.questions.length + 1),
              text: bq.text,
              marks: bq.marks,
              type: bq.type,
              options: bq.options,
              correctOptionId: bq.correctOptionId,
              answer: bq.answer,
            });
          }}
        >
          <option value="">{t(lang, "fromBank")}</option>
          {bank.map((q) => (
            <option key={q.id} value={q.id}>
              {q.text.slice(0, 48)}
            </option>
          ))}
        </Select>
      </div>
    </Slip>
  );
}

function replaceQ(section: PaperSection, i: number, q: PaperQuestion): PaperSection {
  const questions = section.questions.map((x, idx) => (idx === i ? q : x));
  return { ...section, questions };
}

function Field({ label, value, on }: { label: string; value: string; on: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1" value={value} onChange={(e) => on(e.target.value)} />
    </div>
  );
}
