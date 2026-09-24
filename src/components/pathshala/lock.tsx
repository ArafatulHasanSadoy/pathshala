import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/pathshala/store";
import { t } from "@/lib/pathshala/i18n";

export function LockScreen() {
  const lang = useApp((s) => s.settings.lang);
  const pin = useApp((s) => s.settings.pin);
  const setLocked = useApp((s) => s.setLocked);
  const [value, setValue] = useState("");
  const [err, setErr] = useState(false);

  function press(d: string) {
    const next = (value + d).slice(0, 6);
    setValue(next);
    setErr(false);
    if (next.length >= pin.length && pin) {
      if (next === pin) setLocked(false);
      else {
        setErr(true);
        setValue("");
      }
    }
  }

  return (
    <div className="min-h-dvh grid place-items-center bg-ink text-cream px-6">
      <div className="w-full max-w-xs text-center">
        <p className="font-display text-4xl tracking-tight">Pathshala</p>
        <p className="mt-2 text-sm text-cream/70">{t(lang, "unlockHint")}</p>
        <p className="mt-6 tracking-[0.5em] text-2xl">{value.replace(/./g, "•") || "····"}</p>
        {err ? <p className="mt-2 text-sm text-rust-soft">Wrong PIN</p> : null}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((d) => (
            <Button
              key={d || "sp"}
              variant="ghost"
              className="h-14 text-lg text-cream hover:bg-cream/10"
              disabled={d === ""}
              onClick={() => {
                if (d === "⌫") setValue((v) => v.slice(0, -1));
                else if (d) press(d);
              }}
            >
              {d}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
