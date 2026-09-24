import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Slip } from "@/components/pathshala/slip";
import { useApp } from "@/lib/pathshala/store";
import { nid } from "@/lib/pathshala/ids";
import { t } from "@/lib/pathshala/i18n";

export const Route = createFileRoute("/_app/setup")({ component: SetupPage });

function SetupPage() {
  const data = useApp();
  const lang = data.settings.lang;
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(data.settings.sampleData ? "" : data.coaching.name);
  const [addr, setAddr] = useState("");
  const [phone, setPhone] = useState("");
  const [session, setSession] = useState(String(new Date().getFullYear()));
  const [dueDay, setDueDay] = useState("10");
  const [hours, setHours] = useState("4:00 PM – 8:30 PM");
  const [batch, setBatch] = useState("Class 9");
  const [grade, setGrade] = useState("9");

  if (step === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-teal">{t(lang, "app")}</p>
          <h2 className="font-display text-3xl mt-1">{t(lang, "setupLead")}</h2>
          <p className="text-sm text-muted mt-2">{t(lang, "setupBody")}</p>
        </div>
        <Button
          size="lg"
          onClick={() => {
            data.startFresh({ name: name || "My coaching" });
            setStep(1);
          }}
        >
          {t(lang, "startMyCoaching")}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            data.resetDemo();
            toast.success(t(lang, "tryDemo"));
            void nav({ to: "/" });
          }}
        >
          {t(lang, "tryDemo")}
        </Button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <Slip className="flex flex-col gap-3">
        <p className="font-display text-xl">{t(lang, "yourCoaching")}</p>
        <Label>{t(lang, "name")}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunrise Coaching" />
        <Label>{lang === "bn" ? "ঠিকানা" : "Address"}</Label>
        <Input value={addr} onChange={(e) => setAddr(e.target.value)} />
        <Label>{t(lang, "phone")}</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Label>{lang === "bn" ? "সেশন" : "Session"}</Label>
        <Input value={session} onChange={(e) => setSession(e.target.value)} />
        <Label>{t(lang, "dueDay")}</Label>
        <Input type="number" min={1} max={28} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
        <Label>{t(lang, "hours")}</Label>
        <Input value={hours} onChange={(e) => setHours(e.target.value)} />
        <Button
          onClick={() => {
            data.updateCoaching({
              name: name || "My coaching",
              nameBn: name,
              address: addr,
              phone,
              session,
              dueDay: Number(dueDay) || 10,
              hours,
            });
            setStep(2);
          }}
        >
          {t(lang, "next")}
        </Button>
      </Slip>
    );
  }

  return (
    <Slip className="flex flex-col gap-3">
      <p className="font-display text-xl">{t(lang, "firstBatch")}</p>
      <p className="text-sm text-muted">{t(lang, "firstBatchHint")}</p>
      <Label>{t(lang, "batch")}</Label>
      <Input value={batch} onChange={(e) => setBatch(e.target.value)} />
      <Label>{t(lang, "class")}</Label>
      <Input value={grade} onChange={(e) => setGrade(e.target.value)} />
      <Button
        onClick={() => {
          const bid = nid("b");
          const gk = grade || "9";
          data.upsertBatch({
            id: bid,
            name: batch || `Class ${gk}`,
            gradeKey: gk,
            group: "none",
            version: "bangla",
            capacity: 20,
            minStart: null,
            defaultFee: 2000,
            maxPerDay: 3,
          });
          ["Bangla", "English", "Math"].forEach((n) => {
            data.upsertSubject({
              id: nid("s"),
              name: n,
              nameBn: n,
              gradeKey: gk,
            });
          });
          toast.success(t(lang, "done"));
          void nav({ to: "/routine" });
        }}
      >
        {t(lang, "done")}
      </Button>
    </Slip>
  );
}
