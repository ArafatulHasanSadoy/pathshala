import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pin, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slip } from "@/components/pathshala/slip";
import { PrintPreview } from "@/components/pathshala/print-preview";
import { useApp } from "@/lib/pathshala/store";
import { clashesFor, fitsInSlot, type GenerateResult } from "@/lib/pathshala/routine";
import { nid } from "@/lib/pathshala/ids";
import { DAY_BN, DAY_EN, dateISO, dayKeyFromISO } from "@/lib/pathshala/format";
import { t } from "@/lib/pathshala/i18n";
import { ALL_DAYS, CLASS_DAYS, type DayKey, type RoutineEntry } from "@/lib/pathshala/types";

export const Route = createFileRoute("/_app/routine")({ component: RoutinePage });

function RoutinePage() {
  const data = useApp();
  const lang = data.settings.lang;
  const published = data.routineVersions.find((v) => v.status === "published") ?? data.routineVersions[0];
  const [versionId, setVersionId] = useState(published?.id ?? "");
  const version = data.routineVersions.find((v) => v.id === versionId) ?? published;
  const [tab, setTab] = useState<"day" | "week" | "need">("day");
  const todayKey = dayKeyFromISO(dateISO());
  const [day, setDay] = useState<DayKey>(CLASS_DAYS.includes(todayKey) ? todayKey : "sun");
  const [view, setView] = useState("all");
  const [fit, setFit] = useState<{ day: DayKey; slotId: string } | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [printHtml, setPrintHtml] = useState<string | null>(null);
  const [picked, setPicked] = useState<RoutineEntry | null>(null);
  const entries = data.routineEntries.filter((e) => e.versionId === version?.id);
  const filtered = entries.filter((e) => {
    if (view === "all") return true;
    if (view.startsWith("b:")) return e.batchId === view.slice(2);
    if (view.startsWith("t:")) return e.teacherId === view.slice(2);
    if (view.startsWith("r:")) return e.roomId === view.slice(2);
    return true;
  });
  const hard = entries.flatMap((e) => clashesFor(data, e, e.id));

  function generate() {
    if (!version) return;
    const r = data.runGenerate(version.id);
    setResult(r);
    setTab("need");
    toast.success(
      lang === "bn"
        ? `${r.placed} ক্লাস বসলো, ${r.unplaced.length} বাকি`
        : `${r.placed} placed · ${r.unplaced.length} leftover`,
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select className="max-w-48" value={version?.id ?? ""} onChange={(e) => setVersionId(e.target.value)}>
          {data.routineVersions.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </Select>
        <Button size="sm" onClick={generate}>{t(lang, "generate")}</Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (!version) return;
            const html = printRoutine(data, entries, lang);
            data.rememberPrint("routine", version.name, html);
            setPrintHtml(html);
          }}
        >
          <Printer className="size-4" /> {t(lang, "print")}
        </Button>
      </div>
      <p className="text-sm text-muted">{t(lang, "roomsAreShared")}</p>

      {hard[0] ? (
        <Slip className="bg-rust-soft border-rust/20">
          <p className="text-sm text-rust">{hard[0]}</p>
        </Slip>
      ) : null}

      <div className="flex rounded-md border border-line bg-cream p-1">
        {(["day", "week", "need"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`h-11 flex-1 rounded-sm text-sm ${tab === k ? "bg-navy text-cream" : "text-ink-soft"}`}
          >
            {t(lang, k === "day" ? "todayWord" : k === "week" ? "master" : "needTab")}
          </button>
        ))}
      </div>

      {tab === "day" ? (
        <>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {ALL_DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                className={`h-11 min-w-12 shrink-0 rounded-md px-3 text-sm ${day === d ? "bg-navy text-cream" : "border border-line bg-cream text-ink-soft"}`}
              >
                {lang === "bn" ? DAY_BN[d].slice(0, 3) : DAY_EN[d].slice(0, 3)}
              </button>
            ))}
          </div>
          {day === "fri" ? (
            <Slip className="bg-teal-soft">
              <p className="font-medium">{t(lang, "friday")}</p>
              <p className="text-sm text-muted mt-1">{t(lang, "officeOpen")}</p>
            </Slip>
          ) : null}
          {data.slots.map((slot) => {
            const cell = filtered.filter((e) => e.day === day && e.slotId === slot.id);
            return (
              <div key={slot.id} className="flex gap-3">
                <p className="w-16 shrink-0 pt-3 text-xs font-medium tabular-nums text-teal leading-tight">{slot.label}</p>
                <div className="min-w-0 flex-1 flex flex-col gap-2">
                  {cell.map((e) => (
                    <ClassCard key={e.id} entry={e} onOpen={() => setPicked(e)} />
                  ))}
                  <button
                    type="button"
                    className="min-h-11 rounded-md border border-dashed border-line text-sm text-muted"
                    onClick={() => setFit({ day, slotId: slot.id })}
                  >
                    + {t(lang, "emptySlot")}
                  </button>
                </div>
              </div>
            );
          })}
        </>
      ) : null}

      {tab === "week" ? (
        <>
          <Select value={view} onChange={(e) => setView(e.target.value)}>
            <option value="all">{t(lang, "master")}</option>
            {data.batches.map((b) => (
              <option key={b.id} value={`b:${b.id}`}>{b.name}</option>
            ))}
            {data.teachers.map((tch) => (
              <option key={tch.id} value={`t:${tch.id}`}>{tch.name}</option>
            ))}
            {data.rooms.map((r) => (
              <option key={r.id} value={`r:${r.id}`}>{r.name}</option>
            ))}
          </Select>
          <div className="overflow-x-auto rounded-lg border border-line bg-cream">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="p-2 text-muted font-medium">{t(lang, "time")}</th>
                  {ALL_DAYS.map((d) => (
                    <th key={d} className="p-2 font-medium">{lang === "bn" ? DAY_BN[d].slice(0, 3) : DAY_EN[d].slice(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slots.map((slot) => (
                  <tr key={slot.id} className="border-b border-line align-top">
                    <td className="p-2 tabular-nums text-teal whitespace-nowrap">{slot.label}</td>
                    {ALL_DAYS.map((d) => {
                      const cell = filtered.filter((e) => e.day === d && e.slotId === slot.id);
                      return (
                        <td key={d} className="p-1">
                          {cell.map((e) => (
                            <button
                              key={e.id}
                              type="button"
                              className="mb-1 w-full rounded-sm border border-line bg-paper p-1.5 text-left"
                              onClick={() => setPicked(e)}
                            >
                              <span className="block truncate font-medium leading-tight">{data.batches.find((b) => b.id === e.batchId)?.name}</span>
                              <span className="block truncate text-[11px] text-muted">{data.subjects.find((s) => s.id === e.subjectId)?.name}</span>
                            </button>
                          ))}
                          {cell.length === 0 ? (
                            <button
                              type="button"
                              className="w-full min-h-11 text-muted"
                              onClick={() => setFit({ day: d, slotId: slot.id })}
                            >
                              +
                            </button>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {tab === "need" && version ? (
        <NeedPanel versionId={version.id} result={result} onGenerate={generate} />
      ) : null}

      <Dialog open={!!fit} onOpenChange={() => setFit(null)}>
        <DialogContent title={t(lang, "emptySlot")}>
          {fit && version ? <FitList day={fit.day} slotId={fit.slotId} versionId={version.id} onClose={() => setFit(null)} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!picked} onOpenChange={() => setPicked(null)}>
        <DialogContent title={t(lang, "lastMinute")}>
          {picked ? <ClassActions entry={picked} onClose={() => setPicked(null)} /> : null}
        </DialogContent>
      </Dialog>

      {printHtml ? (
        <PrintPreview html={printHtml} title={version?.name ?? "Routine"} onClose={() => setPrintHtml(null)} />
      ) : null}
    </div>
  );
}

function ClassCard({ entry, onOpen }: { entry: RoutineEntry; onOpen: () => void }) {
  const data = useApp();
  const batch = data.batches.find((b) => b.id === entry.batchId);
  const subject = data.subjects.find((s) => s.id === entry.subjectId);
  const teacher = data.teachers.find((tch) => tch.id === entry.teacherId);
  const room = data.rooms.find((r) => r.id === entry.roomId);
  const share = batch?.shareGroup;
  return (
    <button type="button" onClick={onOpen} className="rounded-md border border-line bg-cream p-3 text-left">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium leading-tight">{batch?.name}</p>
        {entry.pinned ? <Pin className="size-3.5 text-teal shrink-0" /> : null}
      </div>
      <p className="mt-1 text-sm text-muted">
        {subject?.name} · {teacher?.name} · {room?.name}
      </p>
      {share ? <p className="mt-1 text-xs text-teal">{share}</p> : null}
    </button>
  );
}

function ClassActions({ entry, onClose }: { entry: RoutineEntry; onClose: () => void }) {
  const data = useApp();
  const lang = data.settings.lang;
  const [date, setDate] = useState(dateISO());
  const [teacherId, setTeacherId] = useState(entry.teacherId);
  const [roomId, setRoomId] = useState(entry.roomId);
  const [slotId, setSlotId] = useState(entry.slotId);
  return (
    <div className="grid gap-2">
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
        {data.teachers.filter((x) => x.status === "active").map((tch) => (
          <option key={tch.id} value={tch.id}>{tch.name}</option>
        ))}
      </Select>
      <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
        {data.rooms.map((r) => (
          <option key={r.id} value={r.id}>{r.name} · {r.capacity}</option>
        ))}
      </Select>
      <Select value={slotId} onChange={(e) => setSlotId(e.target.value)}>
        {data.slots.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </Select>
      <Button
        size="sm"
        onClick={() => {
          data.addOverride({
            date,
            entryId: entry.id,
            type: "replace",
            reason: "Owner replacement",
            newTeacherId: teacherId,
            newRoomId: roomId,
            newSlotId: slotId,
          });
          toast.success(t(lang, "replaceT"));
          onClose();
        }}
      >
        {t(lang, "replaceT")}
      </Button>
      <Button size="sm" variant="outline" onClick={() => { data.togglePin(entry.id); onClose(); }}>
        {entry.pinned ? t(lang, "unpin") : t(lang, "pinClass")}
      </Button>
      <Button
        size="sm"
        variant="danger"
        onClick={() => {
          data.addOverride({ date, entryId: entry.id, type: "cancel", reason: "Cancelled this date" });
          toast.success(t(lang, "cancelToday"));
          onClose();
        }}
      >
        {t(lang, "cancelToday")}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => { data.removeEntry(entry.id); onClose(); }}>
        {t(lang, "delete")}
      </Button>
    </div>
  );
}

function NeedPanel({
  versionId,
  result,
  onGenerate,
}: {
  versionId: string;
  result: GenerateResult | null;
  onGenerate: () => void;
}) {
  const data = useApp();
  const lang = data.settings.lang;
  const reqs = data.routineRequirements.filter((r) => r.versionId === versionId);
  const shareNames = Array.from(new Set(data.batches.map((b) => b.shareGroup?.trim()).filter(Boolean))) as string[];

  function setPer(id: string, perWeek: number) {
    data.saveRequirements(data.routineRequirements.map((r) => (r.id === id ? { ...r, perWeek } : r)));
  }
  function setTeacher(id: string, preferredTeacherId: string) {
    data.saveRequirements(
      data.routineRequirements.map((r) => (r.id === id ? { ...r, preferredTeacherId: preferredTeacherId || null } : r)),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">{t(lang, "needHint")}</p>
      <datalist id="share-groups">
        {shareNames.map((g) => (
          <option key={g} value={g} />
        ))}
        <option value="junior" />
        <option value="mid" />
        <option value="ssc" />
      </datalist>
      {data.batches.map((b) => (
        <Slip key={b.id}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{b.name}</p>
              <p className="text-xs text-muted">
                {b.minStart ? `${t(lang, "hours")} ${b.minStart}` : t(lang, "noMinStart")}
              </p>
            </div>
            <div className="w-36 shrink-0">
              <p className="mb-1 text-[11px] text-muted">{t(lang, "shareGroup")}</p>
              <Input
                list="share-groups"
                className="h-11"
                placeholder={t(lang, "ownRoom")}
                value={b.shareGroup ?? ""}
                onChange={(e) => data.upsertBatch({ ...b, shareGroup: e.target.value.trim() || null })}
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-muted">{t(lang, "shareGroupHint")}</p>
          <div className="mt-3 grid gap-2">
            {reqs
              .filter((r) => r.batchId === b.id)
              .map((r) => {
                const sub = data.subjects.find((s) => s.id === r.subjectId);
                return (
                  <div key={r.id} className="grid grid-cols-[1fr_4.5rem] gap-2 items-center sm:grid-cols-[1fr_4.5rem_1fr]">
                    <span className="text-sm truncate">{sub?.name}</span>
                    <Input type="number" min={0} max={6} value={r.perWeek} onChange={(e) => setPer(r.id, Number(e.target.value))} />
                    <Select className="col-span-2 sm:col-span-1" value={r.preferredTeacherId ?? ""} onChange={(e) => setTeacher(r.id, e.target.value)}>
                      <option value="">{t(lang, "anyTeacher")}</option>
                      {data.teachers.filter((tch) => tch.status === "active").map((tch) => (
                        <option key={tch.id} value={tch.id}>{tch.name}</option>
                      ))}
                    </Select>
                  </div>
                );
              })}
          </div>
        </Slip>
      ))}
      <Button onClick={onGenerate}>{t(lang, "generate")}</Button>
      {result ? (
        <Slip>
          <p className="font-medium">{result.placed}/{result.demanded} {t(lang, "placedCount")}</p>
          {result.unplaced.length ? (
            <div className="mt-3 flex flex-col gap-2">
              {result.unplaced.slice(0, 8).map((u, i) => {
                const b = data.batches.find((x) => x.id === u.batchId);
                const s = data.subjects.find((x) => x.id === u.subjectId);
                return (
                  <div key={`${u.batchId}-${u.subjectId}-${i}`} className="rounded-md border border-line p-3">
                    <p className="text-sm font-medium">{b?.name} · {s?.name}</p>
                    <p className="text-xs text-muted mt-1">{u.reasons[0]}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-ok mt-2">{t(lang, "allPlaced")}</p>
          )}
        </Slip>
      ) : null}
    </div>
  );
}

function FitList({
  day,
  slotId,
  versionId,
  onClose,
}: {
  day: DayKey;
  slotId: string;
  versionId: string;
  onClose: () => void;
}) {
  const data = useApp();
  const opts = useMemo(() => fitsInSlot(data, day, slotId, versionId), [data, day, slotId, versionId]);
  return (
    <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
      {opts.slice(0, 16).map((o, i) => {
        const batch = data.batches.find((b) => b.id === o.batchId);
        const subject = data.subjects.find((s) => s.id === o.subjectId);
        const teacher = data.teachers.find((t) => t.id === o.teacherId);
        const room = data.rooms.find((r) => r.id === o.roomId);
        return (
          <button
            key={i}
            type="button"
            className="rounded-md border border-line p-2 text-left text-sm"
            onClick={() => {
              data.setEntry({
                id: nid("re"),
                versionId,
                day,
                slotId,
                batchId: o.batchId,
                subjectId: o.subjectId,
                teacherId: o.teacherId,
                roomId: o.roomId,
                pinned: true,
              });
              onClose();
            }}
          >
            <span className="font-medium">{batch?.name}</span> · {subject?.name} · {teacher?.name} · {room?.name}
            {o.fillsNeed ? <Badge tone="teal" className="ml-2">{t(data.settings.lang, "fillsNeed")}</Badge> : null}
          </button>
        );
      })}
      {opts.length === 0 ? <p className="text-sm text-muted">{t(data.settings.lang, "emptyRoutine")}</p> : null}
    </div>
  );
}

function printRoutine(
  data: ReturnType<typeof useApp.getState>,
  entries: RoutineEntry[],
  lang: "en" | "bn",
) {
  const days = ALL_DAYS.map((d) => (lang === "bn" ? DAY_BN[d] : DAY_EN[d]));
  let rows = "";
  for (const slot of data.slots) {
    rows += `<tr><td style="border:1px solid #c5d0d4;padding:6px">${slot.label}</td>`;
    for (const day of ALL_DAYS) {
      const cell = entries.filter((e) => e.day === day && e.slotId === slot.id);
      const txt = cell
        .map((e) => {
          const b = data.batches.find((x) => x.id === e.batchId)?.name;
          const s = data.subjects.find((x) => x.id === e.subjectId)?.name;
          const tch = data.teachers.find((x) => x.id === e.teacherId)?.name;
          const r = data.rooms.find((x) => x.id === e.roomId)?.name;
          return `${b}<br/>${s}<br/><span style="color:#5b656e">${tch} · ${r}</span>`;
        })
        .join("<hr/>");
      rows += `<td style="border:1px solid #c5d0d4;padding:6px;font-size:12px">${txt || ""}</td>`;
    }
    rows += "</tr>";
  }
  return `<div>
    <h1 style="text-align:center;margin:0">${data.coaching.name}</h1>
    <p style="text-align:center;color:#5b656e">Weekly routine · ${data.coaching.hours}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:12px">
      <tr><th></th>${days.map((d) => `<th style="border:1px solid #c5d0d4;padding:6px">${d}</th>`).join("")}</tr>
      ${rows}
    </table>
    <p style="font-size:11px;color:#5b656e;margin-top:12px">${data.coaching.fridayNote} Rooms are a shared pool — small groups may sit together.</p>
  </div>`;
}
