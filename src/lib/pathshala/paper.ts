import { nid } from "./ids.ts";
import type { CoachingProfile, McqOption, Paper, PaperQuestion } from "./types.ts";

const MARKS = /\[(\d+(?:\.\d+)?)\]\s*$/;
const Q_START = /^(\d+)[.)]\s*(.*)$/;
const OPT = /^(?:([A-Da-d])|[কখগঘ])[.)]\s*(.*)$/;
const SUB = /^\(([a-dA-D0-9iv]+)\)\s*(.*)$/;

export function parseQuestionDump(text: string): PaperQuestion[] {
  const questions: PaperQuestion[] = [];
  let current: PaperQuestion | null = null;

  const flush = () => {
    if (current && current.text.trim()) questions.push(current);
    current = null;
  };

  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const start = line.match(Q_START);
    if (start) {
      flush();
      const parsed = stripMarks(start[2] ?? "");
      current = {
        id: nid("pq"),
        number: start[1] ?? String(questions.length + 1),
        text: parsed.text,
        marks: parsed.marks ?? 1,
        type: "short",
      };
      continue;
    }
    if (!current) {
      const parsed = stripMarks(line);
      current = {
        id: nid("pq"),
        number: String(questions.length + 1),
        text: parsed.text,
        marks: parsed.marks ?? 1,
        type: "short",
      };
      continue;
    }
    const opt = line.match(OPT);
    if (opt) {
      current.type = "mcq";
      current.options = current.options ?? [];
      const bangla = line[0] && "কখগঘ".includes(line[0]) ? line[0] : (opt[1] ?? "A").toUpperCase();
      const option: McqOption = { id: nid("opt"), key: bangla, text: opt[2] ?? "" };
      current.options.push(option);
      continue;
    }
    const sub = line.match(SUB);
    if (sub) {
      current.type = "cq";
      current.subs = current.subs ?? [];
      const parsed = stripMarks(sub[2] ?? "");
      current.subs.push({
        label: sub[1] ?? "a",
        text: parsed.text,
        marks: parsed.marks ?? 1,
      });
      continue;
    }
    current.text = `${current.text}\n${line}`;
  }
  flush();
  return questions;
}

function stripMarks(text: string): { text: string; marks?: number } {
  const m = text.match(MARKS);
  if (!m) return { text };
  return { text: text.replace(MARKS, "").trim(), marks: Number(m[1]) };
}

export async function fileToJpegDataUrl(file: File, max = 1600): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not read image"));
      image.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return url;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  const rnd = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const KEYS = ["A", "B", "C", "D", "E", "F"];

export function correctOption(q: PaperQuestion): McqOption | undefined {
  if (!q.options?.length) return undefined;
  if (q.correctOptionId) return q.options.find((o) => o.id === q.correctOptionId);
  if (q.answer) return q.options.find((o) => o.key === q.answer || o.id === q.answer);
  return undefined;
}

export function shufflePaperSet(paper: Paper, setLabel: string, seed: number): Paper {
  const copy: Paper = structuredClone(paper);
  copy.id = nid("paper");
  copy.setLabel = setLabel;
  copy.title = paper.title.replace(/\s*\(Set [A-D]\)$/, "");
  copy.title = `${copy.title} (Set ${setLabel})`;
  copy.status = "draft";
  copy.updatedAt = new Date().toISOString();
  copy.sections = copy.sections.map((section, si) => {
    const questions = section.questions.map((q, qi) => {
      if (!q.options?.length) return q;
      const right = correctOption(q);
      const shuffled = seededShuffle(q.options, seed + si * 17 + qi * 31);
      const options = shuffled.map((o, i) => ({ ...o, key: KEYS[i] ?? String(i + 1) }));
      return {
        ...q,
        id: nid("pq"),
        options,
        correctOptionId: right?.id,
        answer: options.find((o) => o.id === right?.id)?.key ?? q.answer,
      };
    });
    const mcqOnly = questions.every((q) => q.type === "mcq");
    return {
      ...section,
      id: nid("sec"),
      questions: mcqOnly ? seededShuffle(questions, seed + 100 + si).map((q, i) => ({ ...q, number: String(i + 1) })) : questions,
    };
  });
  return copy;
}

export function paperMarks(paper: Paper): number {
  return paper.sections.reduce(
    (n, s) => n + s.questions.reduce((m, q) => m + q.marks + (q.subs?.reduce((x, sub) => x + sub.marks, 0) ?? 0), 0),
    0,
  );
}

export function answerKeyHtml(paper: Paper, coaching: CoachingProfile): string {
  const rows = paper.sections
    .map((section) => {
      const qs = section.questions
        .map((q) => {
          const right = correctOption(q);
          const ans = right ? `${right.key}. ${escapeHtml(right.text)}` : escapeHtml(q.answer ?? "—");
          return `<tr><td style="padding:6px 8px;border:1px solid #c5d0d4">${escapeHtml(q.number)}</td><td style="padding:6px 8px;border:1px solid #c5d0d4">${escapeHtml(q.text).slice(0, 88)}</td><td style="padding:6px 8px;border:1px solid #c5d0d4">${ans}</td></tr>`;
        })
        .join("");
      return `<h3 style="margin:16px 0 8px">${escapeHtml(section.title)}</h3><table style="width:100%;border-collapse:collapse;font-size:13px">${qs}</table>`;
    })
    .join("");
  return `<div style="font-family:'Noto Serif Bengali',Georgia,serif;color:#2B3137">
    <div style="text-align:center;border-bottom:2px solid #183B5B;padding-bottom:10px">
      <div style="letter-spacing:.18em;font-size:11px;text-transform:uppercase;color:#2D6F6D">Answer key · Set ${escapeHtml(paper.setLabel)}</div>
      <h1 style="margin:4px 0">${escapeHtml(coaching.name)}</h1>
      <div>${escapeHtml(paper.examName)} — ${escapeHtml(paper.title)}</div>
    </div>
    ${rows}
  </div>`;
}

export function paperHtml(paper: Paper, coaching: CoachingProfile) {
  const sections = paper.sections
    .map((section) => {
      const qs = section.questions
        .map((q) => {
          const img = q.imageData
            ? `<div style="margin:8px 0"><img src="${q.imageData}" style="max-width:100%;max-height:240px;object-fit:contain;border:1px solid #c5d0d4"/></div>`
            : "";
          const opts =
            q.options
              ?.map(
                (o, i) =>
                  `<span style="display:inline-block;min-width:42%;margin:4px 0">${o.key}. ${escapeHtml(o.text)}</span>${i % 2 === 1 ? "<br/>" : ""}`,
              )
              .join("") ?? "";
          const subs =
            q.subs
              ?.map(
                (sub) =>
                  `<div style="margin:4px 0 4px 18px"><b>(${escapeHtml(sub.label)})</b> ${escapeHtml(sub.text)} <span style="float:right">[${sub.marks}]</span></div>`,
              )
              .join("") ?? "";
          return `<div class="q">
            <div class="qhead"><span class="num">${escapeHtml(q.number)}.</span> <span class="body">${escapeHtml(q.text).replace(/\n/g, "<br/>")}</span> <span class="mk">[${q.marks}]</span></div>
            ${img}${opts ? `<div class="opts">${opts}</div>` : ""}${subs}
          </div>`;
        })
        .join("");
      const any = section.answerAny
        ? `<p class="inst">Answer any ${section.answerAny} of the following.</p>`
        : "";
      return `<h3>${escapeHtml(section.title)}</h3>
        ${section.instruction ? `<p class="inst">${escapeHtml(section.instruction)}</p>` : ""}${any}
        ${qs}`;
    })
    .join("");

  return `<div class="sheet">
    <style>
      .sheet { font-family: "Noto Serif Bengali", "Noto Sans Bengali", Georgia, serif; color:#2B3137; }
      .head { text-align:center; border-bottom:2.5px solid #183B5B; padding-bottom:10px; }
      .set { font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:#2D6F6D; }
      h1 { font-size:26px; margin:4px 0 0; font-weight:600; }
      h2 { font-size:16px; margin:8px 0 0; font-weight:600; }
      h3 { font-size:14px; margin:18px 0 6px; border-bottom:1px solid #c5d0d4; padding-bottom:4px; }
      .meta { font-size:13px; margin-top:6px; }
      .inst { font-size:12.5px; color:#4a5560; font-style:italic; margin:4px 0 10px; }
      .q { margin:12px 0; page-break-inside:avoid; }
      .num { font-weight:700; }
      .mk { float:right; font-size:12px; }
      .opts { margin:6px 0 0 18px; font-size:13.5px; }
      .foot { margin-top:48px; display:flex; justify-content:space-between; font-size:12px; }
      .box { border-top:1px solid #2B3137; padding-top:6px; width:28%; text-align:center; }
    </style>
    <div class="head">
      <div class="set">Set ${escapeHtml(paper.setLabel)}</div>
      <h1>${escapeHtml(coaching.name)}</h1>
      <div>${escapeHtml(coaching.address)} · ${escapeHtml(coaching.phone)}</div>
      <h2>${escapeHtml(paper.examName)}</h2>
      <div>${escapeHtml(paper.title)}</div>
      <div class="meta">Time: ${paper.durationMin} minutes &nbsp;|&nbsp; Full marks: ${paper.fullMarks} &nbsp;|&nbsp; Date: ${escapeHtml(paper.date)}</div>
    </div>
    <p class="inst">${escapeHtml(paper.instructions)}</p>
    ${sections}
    <div class="foot">
      <div class="box">Seal</div>
      <div class="box">Invigilator</div>
      <div class="box">Examiner</div>
    </div>
  </div>`;
}

export function admissionHtml(opts: {
  coaching: CoachingProfile;
  name: string;
  code: string;
  grade: string;
  group: string;
  school: string;
  phone: string;
  guardian: string;
  guardianPhone: string;
  batch: string;
  monthly: string;
  admissionFee: string;
  date: string;
  address: string;
}) {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 8px;border:1px solid #c5d0d4;width:38%;color:#5b656e">${k}</td><td style="padding:6px 8px;border:1px solid #c5d0d4">${v}</td></tr>`;
  return `<div style="font-family:Georgia,'Noto Serif Bengali',serif;color:#2B3137;max-width:640px;margin:0 auto">
    <div style="text-align:center;border-bottom:2px solid #183B5B;padding-bottom:10px">
      <div style="letter-spacing:.2em;font-size:11px;text-transform:uppercase;color:#2D6F6D">Admission form</div>
      <h1 style="margin:4px 0">${escapeHtml(opts.coaching.name)}</h1>
      <div>${escapeHtml(opts.coaching.address)} · ${escapeHtml(opts.coaching.phone)}</div>
    </div>
    <h2 style="margin:16px 0 8px">Student</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${row("Student ID", opts.code)}
      ${row("Name", opts.name)}
      ${row("Class / group", `Class ${opts.grade}${opts.group !== "none" ? " · " + opts.group : ""}`)}
      ${row("Batch", opts.batch)}
      ${row("School", opts.school)}
      ${row("Phone / WhatsApp", opts.phone)}
      ${row("Guardian", `${opts.guardian} · ${opts.guardianPhone}`)}
      ${row("Address", opts.address || "—")}
      ${row("Admission date", opts.date)}
      ${row("Admission fee", opts.admissionFee)}
      ${row("Monthly fee", opts.monthly)}
    </table>
    <p style="font-size:12px;color:#5b656e;margin-top:16px">Fees are due by the 10th of each month. This form is a record of the agreement on this device.</p>
    <div style="display:flex;justify-content:space-between;margin-top:48px;font-size:12px">
      <div style="border-top:1px solid #2B3137;width:40%;padding-top:6px">Guardian</div>
      <div style="border-top:1px solid #2B3137;width:40%;padding-top:6px;text-align:right">Office</div>
    </div>
  </div>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "\x26amp;")
    .replace(/</g, "\x26lt;")
    .replace(/>/g, "\x26gt;")
    .replace(/"/g, "\x26quot;");
}
