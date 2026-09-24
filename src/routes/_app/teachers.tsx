import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { Slip } from "@/components/pathshala/slip";
import { useApp } from "@/lib/pathshala/store";
import { money, monthISO, dateISO, dayKeyFromISO, telHref } from "@/lib/pathshala/format";
import { t } from "@/lib/pathshala/i18n";
import { nid } from "@/lib/pathshala/ids";
import { entriesForDate } from "@/lib/pathshala/routine";
import type { Teacher, TeacherKind } from "@/lib/pathshala/types";

export const Route = createFileRoute("/_app/teachers")({ component: TeachersPage });

function teacherKind(tch: Teacher): TeacherKind {
  if (tch.kind) return tch.kind;
  if (tch.payRules.some((r) => r.type === "hourly")) return "guide";
  if (tch.payRules.some((r) => r.type === "monthly") && !tch.payRules.some((r) => r.type === "per_class")) return "monthly";
  return "class";
}

function kindLabel(lang: "en" | "bn", kind: TeacherKind) {
  if (kind === "guide") return t(lang, "guideTeacher");
  if (kind === "monthly") return t(lang, "monthlyTeacher");
  return t(lang, "classTeacher");
}

function TeachersPage() {
  const data = useApp();
  const lang = data.settings.lang;
  const ym = monthISO();
  const [tab, setTab] = useState<"pay" | "att">("pay");
  const [payFor, setPayFor] = useState<Teacher | null>(null);
  const [amount, setAmount] = useState("");
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<TeacherKind>("class");
  const [date, setDate] = useState(dateISO());

  const classes = entriesForDate(data, date, dayKeyFromISO(date));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex rounded-md border border-line bg-cream p-1">
        <button type="button" className={`h-11 flex-1 rounded-sm text-sm ${tab === "pay" ? "bg-navy text-cream" : ""}`} onClick={() => setTab("pay")}>
          {t(lang, "payTab")}
        </button>
        <button type="button" className={`h-11 flex-1 rounded-sm text-sm ${tab === "att" ? "bg-navy text-cream" : ""}`} onClick={() => setTab("att")}>
          {t(lang, "teacherAttendance")}
        </button>
      </div>

      {tab === "att" ? (
        <>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          {data.teachers.filter((tch) => tch.status === "active").map((tch) => {
            const kind = teacherKind(tch);
            const own = classes.filter((e) => e.teacherId === tch.id);
            const dayRow = (data.teacherAttendance ?? []).find((a) => a.teacherId === tch.id && a.date === date && !a.entryId);
            return (
              <Slip key={tch.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{lang === "bn" ? tch.nameBn : tch.name}</p>
                    <p className="text-xs text-muted">{kindLabel(lang, kind)}</p>
                  </div>
                  <Badge tone="muted">{kind}</Badge>
                </div>
                {kind === "class" || kind === "guide" ? (
                  <div className="mt-3 flex flex-col gap-2">
                    {own.length === 0 ? <p className="text-sm text-muted">{t(lang, "todayOff")}</p> : null}
                    {own.map((e) => {
                      const row = (data.teacherAttendance ?? []).find((a) => a.teacherId === tch.id && a.date === date && a.entryId === e.id);
                      const sub = data.subjects.find((s) => s.id === e.subjectId);
                      const slot = data.slots.find((s) => s.id === e.slotId);
                      return (
                        <div key={e.id} className="rounded-md border border-line p-2">
                          <p className="text-sm">{slot?.label} · {sub?.name}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant={row?.status === "present" ? "stamp" : "outline"}
                              onClick={() =>
                                data.saveTeacherAttendance({
                                  id: nid("ta"),
                                  date,
                                  teacherId: tch.id,
                                  entryId: e.id,
                                  status: "present",
                                  hours: kind === "guide" ? 1 : 0,
                                  note: "",
                                })
                              }
                            >
                              {t(lang, "markPresent")}
                            </Button>
                            <Button
                              size="sm"
                              variant={row?.status === "absent" ? "stamp" : "outline"}
                              onClick={() =>
                                data.saveTeacherAttendance({
                                  id: nid("ta"),
                                  date,
                                  teacherId: tch.id,
                                  entryId: e.id,
                                  status: "absent",
                                  hours: 0,
                                  note: "",
                                })
                              }
                            >
                              {t(lang, "markAbsent")}
                            </Button>
                            {kind === "guide" ? (
                              <Input
                                className="w-20"
                                type="number"
                                min={0}
                                step={0.5}
                                defaultValue={row?.hours ?? 1}
                                onBlur={(ev) =>
                                  data.saveTeacherAttendance({
                                    id: nid("ta"),
                                    date,
                                    teacherId: tch.id,
                                    entryId: e.id,
                                    status: "present",
                                    hours: Number(ev.target.value) || 0,
                                    note: "",
                                  })
                                }
                              />
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant={dayRow?.status === "present" ? "stamp" : "outline"}
                      onClick={() =>
                        data.saveTeacherAttendance({
                          id: nid("ta"),
                          date,
                          teacherId: tch.id,
                          entryId: null,
                          status: "present",
                          hours: 0,
                          note: "",
                        })
                      }
                    >
                      {t(lang, "markPresent")}
                    </Button>
                    <Button
                      size="sm"
                      variant={dayRow?.status === "absent" ? "stamp" : "outline"}
                      onClick={() =>
                        data.saveTeacherAttendance({
                          id: nid("ta"),
                          date,
                          teacherId: tch.id,
                          entryId: null,
                          status: "absent",
                          hours: 0,
                          note: "",
                        })
                      }
                    >
                      {t(lang, "markAbsent")}
                    </Button>
                  </div>
                )}
              </Slip>
            );
          })}
        </>
      ) : (
        <>
          {data.teachers.map((tch) => {
            const calc = teacherCalc(data, tch, ym);
            const paid = data.payouts.filter((p) => p.teacherId === tch.id && p.month === ym).reduce((n, p) => n + p.amount, 0);
            const kind = teacherKind(tch);
            return (
              <Slip key={tch.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-xl">{lang === "bn" ? tch.nameBn : tch.name}</p>
                    <p className="text-sm text-muted">{kindLabel(lang, kind)} · {tch.payRules.map((r) => `${r.type} ৳${r.rate}`).join(" · ")}</p>
                  </div>
                  <Badge tone={tch.status === "active" ? "ok" : "muted"}>{tch.status}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted">{kind === "guide" ? t(lang, "hoursWorked") : t(lang, "classesHeld")}</p>
                    <p className="tabular-nums font-medium">{kind === "guide" ? calc.hours : calc.held}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">{t(lang, "calculated")}</p>
                    <p className="tabular-nums font-medium">{money(calc.pay, lang)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">{t(lang, "alreadyPaid")}</p>
                    <p className="tabular-nums font-medium">{money(paid, lang)}</p>
                  </div>
                </div>
                <p className="text-sm mt-2">
                  {t(lang, "remaining")} {money(Math.max(0, calc.pay - paid), lang)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={telHref(tch.phone)}>
                    <Button size="sm" variant="outline">{t(lang, "call")}</Button>
                  </a>
                  <Button size="sm" onClick={() => { setPayFor(tch); setAmount(String(Math.max(0, calc.pay - paid))); }}>
                    {t(lang, "payTeacher")}
                  </Button>
                </div>
              </Slip>
            );
          })}
        </>
      )}

      <Dialog open={!!payFor} onOpenChange={() => setPayFor(null)}>
        <DialogContent title={t(lang, "payTeacher")}>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!payFor) return;
              data.payTeacher(payFor.id, Number(amount) || 0, ym, "Monthly payout");
              toast.success(t(lang, "save"));
              setPayFor(null);
            }}
          >
            <Label>{t(lang, "amount")}</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Button type="submit">{t(lang, "confirm")}</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Slip>
        <p className="font-medium mb-2">{t(lang, "teachers")}</p>
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={lang === "bn" ? "নতুন শিক্ষকের নাম" : "New teacher name"} />
        <Select className="mt-2" value={newKind} onChange={(e) => setNewKind(e.target.value as TeacherKind)}>
          <option value="class">{t(lang, "classTeacher")} — {lang === "bn" ? "ক্লাসপ্রতি" : "per class"}</option>
          <option value="guide">{t(lang, "guideTeacher")} — {lang === "bn" ? "ঘণ্টাপ্রতি" : "hourly"}</option>
          <option value="monthly">{t(lang, "monthlyTeacher")}</option>
        </Select>
        <Button
          className="mt-2"
          size="sm"
          onClick={() => {
            if (!newName.trim()) return;
            data.upsertTeacher({
              id: nid("t"),
              name: newName.trim(),
              nameBn: newName.trim(),
              phone: "",
              subjectIds: [],
              joiningDate: new Date().toISOString().slice(0, 10),
              address: "",
              notes: "",
              payRules: [
                newKind === "monthly"
                  ? { type: "monthly", rate: 12000 }
                  : newKind === "guide"
                    ? { type: "hourly", rate: 400 }
                    : { type: "per_class", rate: 500 },
              ],
              unavailable: [],
              status: "active",
              maxPerWeek: 14,
              maxPerDay: 4,
              preferredSlotIds: [],
              preferredDays: [],
              kind: newKind,
            });
            setNewName("");
            toast.success(t(lang, "save"));
          }}
        >
          {t(lang, "add")}
        </Button>
      </Slip>
    </div>
  );
}

function teacherCalc(data: ReturnType<typeof useApp.getState>, tch: Teacher, ym: string) {
  const kind = teacherKind(tch);
  const att = (data.teacherAttendance ?? []).filter((a) => a.teacherId === tch.id && a.date.startsWith(ym));
  const presentClass = att.filter((a) => a.status === "present" && a.entryId).length;
  const hours = att.filter((a) => a.status === "present").reduce((n, a) => n + (a.hours || 0), 0);
  const published = data.routineVersions.find((v) => v.status === "published");
  const entries = data.routineEntries.filter((e) => e.versionId === published?.id && e.teacherId === tch.id);
  const sessions = data.attendance.filter((a) => a.date.startsWith(ym) && a.held && entries.some((e) => e.id === a.entryId));
  const held = presentClass || sessions.length;
  let pay = 0;
  for (const rule of tch.payRules) {
    if (rule.type === "monthly") pay += rule.rate;
    if (rule.type === "per_class") pay += held * rule.rate;
    if (rule.type === "hourly") pay += (hours || held) * rule.rate;
  }
  return { held, hours: hours || held, pay, kind };
}
