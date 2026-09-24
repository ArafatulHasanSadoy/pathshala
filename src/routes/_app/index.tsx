import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, BookOpen, CalendarDays, Phone, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Slip, Stat } from "@/components/pathshala/slip";
import { useApp } from "@/lib/pathshala/store";
import { actionItems, classesOn, dashboardStats, nextDate, todayISO } from "@/lib/pathshala/selectors";
import { DAY_BN, DAY_EN, dayKeyFromISO, money, prettyDate, telHref } from "@/lib/pathshala/format";
import { t } from "@/lib/pathshala/i18n";
import { CollectForm } from "@/components/pathshala/collect-dialog";
import type { Student } from "@/lib/pathshala/types";

export const Route = createFileRoute("/_app/")({ component: Today });

function Today() {
  const data = useApp();
  const lang = data.settings.lang;
  const today = todayISO();
  const day = dayKeyFromISO(today);
  const stats = dashboardStats(data, today);
  const actions = actionItems(data, today);
  const bn = lang === "bn";
  const tomorrow = nextDate(today);
  const tomorrowClasses = classesOn(data, tomorrow);
  const [pick, setPick] = useState<Student | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-muted">
          {prettyDate(today)} · {bn ? DAY_BN[day] : DAY_EN[day]}
        </p>
        <h2 className="font-display text-3xl tracking-tight mt-1">{data.coaching.name}</h2>
        <p className="text-sm text-muted mt-1">
          {data.settings.sampleData ? t(lang, "sampleOn") : t(lang, "noInternet")}
        </p>
      </div>

      <Link to="/guide">
        <Slip className="bg-teal-soft border-teal/20 flex items-start gap-3">
          <BookOpen className="size-5 text-teal mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{t(lang, "ownerGuide")}</p>
            <p className="text-sm text-muted mt-1">{t(lang, "ownerGuideLead")}</p>
          </div>
        </Slip>
      </Link>

      {day === "fri" ? (
        <Slip className="bg-teal-soft border-teal/20">
          <p className="font-medium">{t(lang, "friday")}</p>
          <p className="text-sm text-muted mt-1">{t(lang, "officeOpen")}</p>
        </Slip>
      ) : null}
      {day === "sat" ? (
        <Slip className="bg-amber-soft">
          <p className="font-medium">{t(lang, "saturday")}</p>
        </Slip>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t(lang, "collection")} value={data.settings.privacyMode ? "••••" : money(stats.collection, lang)} tone="teal" />
        <Stat label={t(lang, "totalDue")} value={data.settings.privacyMode ? "••••" : money(stats.due, lang)} tone="rust" hint={t(lang, "dueBy")} />
        <Stat label={t(lang, "cash")} value={data.settings.privacyMode ? "••••" : money(stats.cash, lang)} />
        <Stat label={t(lang, "classesToday")} value={String(stats.classes)} hint={`${stats.present} ${t(lang, "present").toLowerCase()}`} />
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="size-4 text-teal" />
          <h3 className="font-display text-xl">{t(lang, "actionList")}</h3>
          <Badge tone="ink">{actions.length}</Badge>
        </div>
        {actions.length === 0 ? (
          <Slip>
            <p>{t(lang, "emptyActions")}</p>
          </Slip>
        ) : (
          <div className="flex flex-col gap-2">
            {actions.slice(0, 12).map((a) => {
              const student = a.href.startsWith("/students/")
                ? data.students.find((s) => a.href.endsWith(s.id))
                : undefined;
              return (
                <Slip key={a.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{bn ? a.titleBn : a.title}</p>
                    <p className="text-xs text-muted">{a.meta}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {student ? (
                      <Button size="sm" onClick={() => setPick(student)}>
                        {t(lang, "collect")}
                      </Button>
                    ) : null}
                    {student ? (
                      <a href={telHref(student.guardianPhone)}>
                        <Button variant="outline" size="sm">
                          <Phone className="size-3.5" /> {t(lang, "call")}
                        </Button>
                      </a>
                    ) : null}
                    <Link to={a.href}>
                      <Button variant="ghost" size="sm">
                        {t(lang, "seeStudent")}
                      </Button>
                    </Link>
                  </div>
                </Slip>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xl">
            {stats.classesList.length === 0 && tomorrowClasses.length
              ? t(lang, "tomorrow")
              : t(lang, "classesToday")}
          </h3>
          <Link to="/attendance" className="text-sm text-teal">
            {t(lang, "takeAttendance")}
          </Link>
        </div>
        {(stats.classesList.length ? stats.classesList : tomorrowClasses).length === 0 ? (
          <Slip>
            <p className="text-muted">{t(lang, "todayOff")}</p>
          </Slip>
        ) : (
          <div className="flex flex-col gap-2">
            {(stats.classesList.length ? stats.classesList : tomorrowClasses).map((e) => {
              const batch = data.batches.find((b) => b.id === e.batchId);
              const subject = data.subjects.find((s) => s.id === e.subjectId);
              const teacher = data.teachers.find((tch) => tch.id === e.teacherId);
              const room = data.rooms.find((r) => r.id === e.roomId);
              const slot = data.slots.find((s) => s.id === e.slotId);
              return (
                <Slip key={e.id} className="flex items-center gap-3">
                  <div className="w-24 shrink-0 text-sm tabular-nums text-teal">{slot?.label}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {batch?.name} · {lang === "bn" ? subject?.nameBn : subject?.name}
                    </p>
                    <p className="text-xs text-muted">
                      {teacher?.name} · {room?.name}
                    </p>
                  </div>
                  <Link to="/attendance" search={{ entry: e.id }}>
                    <Button size="sm" variant="outline">
                      {t(lang, "attendance")}
                    </Button>
                  </Link>
                </Slip>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/fees">
          <Slip className="flex items-center gap-3">
            <Wallet className="size-5 text-teal" />
            <div>
              <p className="font-medium">{t(lang, "collect")}</p>
              <p className="text-xs text-muted">{t(lang, "dueBy")}</p>
            </div>
          </Slip>
        </Link>
        <Link to="/routine">
          <Slip className="flex items-center gap-3">
            <CalendarDays className="size-5 text-teal" />
            <div>
              <p className="font-medium">{t(lang, "wizard")}</p>
              <p className="text-xs text-muted">{t(lang, "master")}</p>
            </div>
          </Slip>
        </Link>
      </div>

      <Dialog open={!!pick} onOpenChange={() => setPick(null)}>
        <DialogContent title={pick ? pick.name : t(lang, "collect")}>
          {pick ? <CollectForm student={pick} onDone={() => setPick(null)} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
