import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/pathshala/store";
import { searchAll } from "@/lib/pathshala/selectors";
import { t } from "@/lib/pathshala/i18n";
import { Avatar } from "./avatar";

export function SearchPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const data = useApp();
  const lang = data.settings.lang;
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const res = useMemo(() => searchAll(data, q), [data, q]);

  function go(to: string) {
    onOpenChange(false);
    setQ("");
    void nav({ to });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden" title={t(lang, "search")}>
        <div className="p-3 border-b border-line">
          <Input
            autoFocus
            placeholder={t(lang, "search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {!q.trim() ? (
            <p className="p-3 text-sm text-muted">{t(lang, "lookUp")}</p>
          ) : (
            <>
              {res.students.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-paper-2"
                  onClick={() => {
                    onOpenChange(false);
                    setQ("");
                    void nav({ to: "/students/$id", params: { id: s.id } });
                  }}
                >
                  <Avatar name={s.name} hue={s.avatarHue} photo={s.photoData} size="sm" />
                  <span>
                    <span className="block text-sm">{s.name}</span>
                    <span className="text-xs text-muted">
                      {s.code} · Class {s.grade} · {s.school}
                    </span>
                  </span>
                </button>
              ))}
              {res.teachers.map((tch) => (
                <button
                  key={tch.id}
                  type="button"
                  className="flex w-full rounded-md p-2 text-left text-sm hover:bg-paper-2"
                  onClick={() => go("/teachers")}
                >
                  {tch.name}
                </button>
              ))}
              {res.payments.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="flex w-full rounded-md p-2 text-left text-sm hover:bg-paper-2"
                  onClick={() => go("/fees")}
                >
                  {p.receiptNo}
                </button>
              ))}
              {res.enquiries.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="flex w-full rounded-md p-2 text-left text-sm hover:bg-paper-2"
                  onClick={() => go("/enquiries")}
                >
                  {e.studentName} · {e.phone}
                </button>
              ))}
              {res.students.length + res.teachers.length + res.payments.length + res.enquiries.length === 0 ? (
                <p className="p-3 text-sm text-muted">{t(lang, "noStudents")}</p>
              ) : null}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
