import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/pathshala/avatar";
import { Slip } from "@/components/pathshala/slip";
import { useApp } from "@/lib/pathshala/store";
import { entriesForDate } from "@/lib/pathshala/routine";
import { ATT_EN, dayKeyFromISO, telHref, waHref } from "@/lib/pathshala/format";
import { t } from "@/lib/pathshala/i18n";
import { todayISO } from "@/lib/pathshala/selectors";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/pathshala/types";

type Search = { entry?: string };

export const Route = createFileRoute("/_app/attendance")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    entry: typeof s.entry === "string" ? s.entry : undefined,
  }),
  component: AttendancePage,
});

const CYCLE: AttendanceStatus[] = ["present", "absent", "late", "excused", "left_early"];

function AttendancePage() {
  const data = useApp();
  const lang = data.settings.lang;
  const { entry: entryQ } = Route.useSearch();
  const [date, setDate] = useState(todayISO());
  const day = dayKeyFromISO(date);
  const classes = entriesForDate(data, date, day);
  const [active, setActive] = useState(entryQ ?? "");
  const chosen = classes.some((e) => e.id === active) ? active : (classes[0]?.id ?? "");
  const entry = data.routineEntries.find((e) => e.id === chosen) ?? classes.find((e) => e.id === chosen);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{t(lang, "allPresent")}</p>
      <label className="text-sm text-muted">
        {t(lang, "pickDate")}
        <Input type="date" className="mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      {day === "fri" ? <Slip className="bg-teal-soft border-teal/20">{t(lang, "friday")}</Slip> : null}
      {day === "sat" ? <Slip className="bg-amber-soft">{t(lang, "examSaturday")}</Slip> : null}
      {classes.length === 0 ? <Slip>{t(lang, "todayOff")}</Slip> : null}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {classes.map((e) => {
          const batch = data.batches.find((b) => b.id === e.batchId);
          const slot = data.slots.find((s) => s.id === e.slotId);
          return (
            <Button key={e.id} size="sm" variant={chosen === e.id ? "stamp" : "outline"} onClick={() => setActive(e.id)}>
              {slot?.label} {batch?.name}
            </Button>
          );
        })}
      </div>
      {entry ? <Roster key={`${date}-${entry.id}`} date={date} entryId={entry.id} /> : null}
    </div>
  );
}

function Roster({ date, entryId }: { date: string; entryId: string }) {
  const data = useApp();
  const lang = data.settings.lang;
  const entry = data.routineEntries.find((e) => e.id === entryId);
  const existing = data.attendance.find((a) => a.date === date && a.entryId === entryId);
  const roster = data.students.filter((s) => s.status === "active" && entry && s.batchIds.includes(entry.batchId));
  const [held, setHeld] = useState(existing?.held ?? true);
  const [cancelReason, setCancelReason] = useState(existing?.cancelReason ?? "");
  const [rows, setRows] = useState<AttendanceRecord[]>(() => {
    if (existing) return existing.records;
    return roster.map((s) => ({
      studentId: s.id,
      status: s.admissionDate > date ? "not_enrolled" : ("present" as const),
      inTime: "16:55",
      outTime: "20:00",
    }));
  });
  const [openId, setOpenId] = useState<string | null>(null);

  const absent = rows.filter((r) => r.status === "absent");

  function cycle(id: string) {
    setRows((rs) =>
      rs.map((r) => {
        if (r.studentId !== id) return r;
        if (r.status === "not_enrolled") return r;
        const i = CYCLE.indexOf(r.status);
        return { ...r, status: CYCLE[(i + 1) % CYCLE.length] ?? "present" };
      }),
    );
  }

  function patchRow(id: string, extra: Partial<AttendanceRecord>) {
    setRows((rs) => rs.map((r) => (r.studentId === id ? { ...r, ...extra } : r)));
  }

  const batch = data.batches.find((b) => b.id === entry?.batchId);
  const subject = data.subjects.find((s) => s.id === entry?.subjectId);

  return (
    <div className="flex flex-col gap-3">
      <Slip>
        <p className="font-medium">
          {batch?.name} · {subject?.name}
        </p>
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant={held ? "primary" : "outline"} onClick={() => setHeld(true)}>
            {t(lang, "held")}
          </Button>
          <Button size="sm" variant={!held ? "danger" : "outline"} onClick={() => setHeld(false)}>
            {t(lang, "notHeld")}
          </Button>
        </div>
        {!held ? (
          <Input className="mt-2" placeholder={t(lang, "reason")} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
        ) : null}
      </Slip>
      {held
        ? rows.map((r) => {
            const st = data.students.find((s) => s.id === r.studentId);
            if (!st) return null;
            const tone =
              r.status === "absent" ? "rust" : r.status === "late" ? "amber" : r.status === "present" ? "ok" : "muted";
            const open = openId === r.studentId;
            return (
              <Slip key={r.studentId}>
                <button type="button" onClick={() => cycle(r.studentId)} className="flex w-full items-center gap-3 text-left">
                  <Avatar name={st.name} hue={st.avatarHue} photo={st.photoData} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{st.name}</p>
                    <p className="text-xs text-muted">{st.code}</p>
                  </div>
                  <Badge tone={tone}>{ATT_EN[r.status]}</Badge>
                </button>
                <button
                  type="button"
                  className="mt-2 text-xs text-teal"
                  onClick={() => setOpenId(open ? null : r.studentId)}
                >
                  {t(lang, "inOut")}
                </button>
                {open || r.status === "absent" || r.status === "late" ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input
                      type="time"
                      value={r.inTime ?? ""}
                      onChange={(e) => patchRow(r.studentId, { inTime: e.target.value })}
                    />
                    <Input
                      type="time"
                      value={r.outTime ?? ""}
                      onChange={(e) => patchRow(r.studentId, { outTime: e.target.value })}
                    />
                    {r.status === "absent" ? (
                      <Input
                        className="col-span-2"
                        placeholder={t(lang, "whyAbsent")}
                        value={r.reason ?? ""}
                        onChange={(e) => patchRow(r.studentId, { reason: e.target.value })}
                      />
                    ) : null}
                  </div>
                ) : null}
              </Slip>
            );
          })
        : null}

      {absent.length > 0 && held ? (
        <Slip>
          <p className="font-medium mb-2">{t(lang, "absences")}</p>
          {absent.map((r) => {
            const st = data.students.find((s) => s.id === r.studentId);
            if (!st) return null;
            return (
              <div key={r.studentId} className="flex items-center gap-2 py-1 text-sm">
                <span className="flex-1">
                  {st.name}
                  {r.reason ? <span className="block text-xs text-muted">{r.reason}</span> : null}
                </span>
                <a href={telHref(st.guardianPhone)} className="text-teal">
                  {t(lang, "call")}
                </a>
                <a
                  href={waHref(st.guardianPhone, `${st.name} was absent today at Advance Educare.`)}
                  className="text-teal"
                >
                  {t(lang, "whatsapp")}
                </a>
              </div>
            );
          })}
        </Slip>
      ) : null}

      <Button
        onClick={() => {
          data.saveAttendance({ date, entryId, held, cancelReason, records: rows });
          toast.success(t(lang, "save"));
        }}
      >
        {t(lang, "save")}
      </Button>
    </div>
  );
}
