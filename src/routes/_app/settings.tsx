import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Slip } from "@/components/pathshala/slip";
import { exportBackup, useApp } from "@/lib/pathshala/store";
import { downloadText, prettyDate } from "@/lib/pathshala/format";
import { t } from "@/lib/pathshala/i18n";
import { nid } from "@/lib/pathshala/ids";
import type { AppData } from "@/lib/pathshala/types";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

function SettingsPage() {
  const data = useApp();
  const lang = data.settings.lang;
  const fileRef = useRef<HTMLInputElement>(null);
  const [pin, setPin] = useState(data.settings.pin);
  const [name, setName] = useState(data.coaching.name);
  const [addr, setAddr] = useState(data.coaching.address);
  const [phone, setPhone] = useState(data.coaching.phone);
  const [due, setDue] = useState(String(data.coaching.dueDay));
  const [hours, setHours] = useState(data.coaching.hours);

  return (
    <div className="flex flex-col gap-4">
      {data.settings.sampleData ? (
        <Slip className="bg-teal-soft">
          <p className="text-sm">{t(lang, "sampleOn")}</p>
          <Link to="/setup" className="mt-2 inline-block">
            <Button size="sm">{t(lang, "startMyCoaching")}</Button>
          </Link>
        </Slip>
      ) : null}

      <Link to="/guide">
        <Slip className="bg-teal-soft border-teal/20">
          <p className="font-medium">{t(lang, "ownerGuide")}</p>
          <p className="text-sm text-muted mt-1">{t(lang, "ownerGuideLead")}</p>
        </Slip>
      </Link>

      <Slip>
        <p className="font-display text-xl mb-1">{t(lang, "language")}</p>
        <div className="flex gap-2">
          <Button size="sm" variant={lang === "en" ? "stamp" : "outline"} onClick={() => data.setLang("en")}>
            {t(lang, "english")}
          </Button>
          <Button size="sm" variant={lang === "bn" ? "stamp" : "outline"} onClick={() => data.setLang("bn")}>
            {t(lang, "bangla")}
          </Button>
        </div>
      </Slip>

      <Slip>
        <p className="font-display text-xl mb-3">{t(lang, "coaching")}</p>
        <Label>{t(lang, "name")}</Label>
        <Input className="mt-1 mb-2" value={name} onChange={(e) => setName(e.target.value)} />
        <Label>{lang === "bn" ? "ঠিকানা" : "Address"}</Label>
        <Input className="mt-1 mb-2" value={addr} onChange={(e) => setAddr(e.target.value)} />
        <Label>{t(lang, "phone")}</Label>
        <Input className="mt-1 mb-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Label>{t(lang, "dueDay")}</Label>
        <Input className="mt-1 mb-2" type="number" min={1} max={28} value={due} onChange={(e) => setDue(e.target.value)} />
        <Label>{t(lang, "hours")}</Label>
        <Input className="mt-1 mb-2" value={hours} onChange={(e) => setHours(e.target.value)} />
        <Button
          variant="outline"
          onClick={() => {
            data.updateCoaching({ name, address: addr, phone, dueDay: Number(due) || 10, hours });
            toast.success(t(lang, "save"));
          }}
        >
          {t(lang, "save")}
        </Button>
      </Slip>

      <Slip>
        <p className="font-medium mb-2">{t(lang, "privacyMode")}</p>
        <Button size="sm" variant={data.settings.privacyMode ? "stamp" : "outline"} onClick={() => data.setPrivacy(!data.settings.privacyMode)}>
          {data.settings.privacyMode ? t(lang, "yes") : t(lang, "no")}
        </Button>
      </Slip>

      <Slip>
        <p className="font-display text-xl mb-2">{t(lang, "roomsSlots")}</p>
        {data.rooms.map((r) => (
          <p key={r.id} className="text-sm py-1">{r.name} · {r.capacity}</p>
        ))}
        <Button
          className="mt-2"
          size="sm"
          variant="outline"
          onClick={() => {
            data.upsertRoom({ id: nid("rm"), name: `Room ${String.fromCharCode(65 + data.rooms.length)}`, capacity: 16, facilities: ["whiteboard"] });
          }}
        >
          {t(lang, "addRoom")}
        </Button>
        <div className="mt-3">
          {data.batches.map((b) => (
            <div key={b.id} className="flex items-center gap-2 py-1">
              <p className="min-w-0 flex-1 text-sm">{b.name}</p>
              <Input
                className="h-10 max-w-36"
                placeholder={t(lang, "shareGroup")}
                value={b.shareGroup ?? ""}
                onChange={(e) => data.upsertBatch({ ...b, shareGroup: e.target.value.trim() || null })}
              />
            </div>
          ))}
          <Button
            className="mt-2"
            size="sm"
            variant="outline"
            onClick={() => {
              data.upsertBatch({
                id: nid("b"),
                name: `Batch ${data.batches.length + 1}`,
                gradeKey: "custom",
                group: "none",
                version: "bangla",
                capacity: 16,
                minStart: null,
                defaultFee: 2000,
                maxPerDay: 3,
              });
            }}
          >
            {t(lang, "addBatch")}
          </Button>
        </div>
      </Slip>

      <Slip>
        <p className="font-display text-xl mb-2">{t(lang, "pin")}</p>
        <Input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" />
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              data.setPin(pin, true);
              toast.success(t(lang, "save"));
            }}
          >
            Enable
          </Button>
          <Button size="sm" variant="ghost" onClick={() => data.setPin("", false)}>
            Disable
          </Button>
          {data.settings.pinEnabled ? (
            <Button size="sm" variant="outline" onClick={() => data.setLocked(true)}>
              Lock now
            </Button>
          ) : null}
        </div>
      </Slip>

      <Slip>
        <p className="font-display text-xl mb-2">{t(lang, "installOnPhone")}</p>
        <p className="text-sm text-muted">{t(lang, "addToHome")}</p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
          <li>{lang === "bn" ? "ক্রোমে এই পাতা খুলুন।" : "Open Pathshala in Chrome on the phone."}</li>
          <li>{lang === "bn" ? "মেনু ⋮ → Add to Home screen / Install app।" : "Menu ⋮ → Add to Home screen / Install app."}</li>
          <li>{lang === "bn" ? "হোম স্ক্রিনের আইকন থেকে খুলুন — অফলাইনে চলবে।" : "Open from the home-screen icon. It works offline on that phone."}</li>
        </ol>
        <p className="mt-3 text-sm text-muted">
          {lang === "bn"
            ? "মালিককে শেয়ার: এই লিংক পাঠান, তিনি হোম স্ক্রিনে বসাবেন। ডেটা সেই ফোনেই থাকে — স্থানান্তর করতে Backup JSON নামান।"
            : "To share with the owner: send this same link. Data lives on that phone — export Backup JSON to move it."}
        </p>
      </Slip>

      <Slip>
        <p className="font-display text-xl mb-1">{t(lang, "backup")}</p>
        <p className="text-sm text-muted mb-3">
          {data.settings.lastBackupAt ? prettyDate(data.settings.lastBackupAt.slice(0, 10)) : t(lang, "neverBacked")}
        </p>
        <p className="text-sm text-muted mb-3">{t(lang, "noInternet")}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              downloadText(`pathshala-backup-${new Date().toISOString().slice(0, 10)}.json`, exportBackup());
              data.markBackup();
              toast.success(t(lang, "exportBackup"));
            }}
          >
            {t(lang, "exportBackup")}
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            {t(lang, "importBackup")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const parsed = JSON.parse(await file.text()) as { data?: AppData };
                if (!parsed.data?.students) throw new Error("bad");
                data.restoreFrom(parsed.data);
                toast.success(t(lang, "restore"));
              } catch {
                toast.error("Could not restore that file.");
              }
            }}
          />
        </div>
      </Slip>

      <Slip>
        <p className="font-display text-xl mb-2">{t(lang, "activity")}</p>
        <div className="flex flex-col gap-2 text-sm">
          {data.activity.slice(0, 12).map((a) => (
            <p key={a.id}>
              <span className="text-muted">{a.at.slice(0, 16).replace("T", " ")}</span> · {lang === "bn" ? a.textBn : a.text}
            </p>
          ))}
        </div>
      </Slip>

      <Slip>
        <p className="font-medium mb-2">{t(lang, "demoReset")}</p>
        <Button
          variant="danger"
          onClick={() => {
            if (confirm("Reload the Advance Educare demo khata?")) data.resetDemo();
          }}
        >
          {t(lang, "demoReset")}
        </Button>
      </Slip>
    </div>
  );
}
