import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slip } from "@/components/pathshala/slip";
import { PrintPreview } from "@/components/pathshala/print-preview";
import { useApp } from "@/lib/pathshala/store";
import { GUIDE_SECTIONS, guideHtml } from "@/lib/pathshala/guide";
import { t } from "@/lib/pathshala/i18n";

export const Route = createFileRoute("/_app/guide")({ component: GuidePage });

function GuidePage() {
  const data = useApp();
  const lang = data.settings.lang;
  const [open, setOpen] = useState<string>(GUIDE_SECTIONS[0]!.id);
  const [print, setPrint] = useState<string | null>(null);
  const title = t(lang, "ownerGuide");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-teal">{t(lang, "app")}</p>
        <h2 className="font-display text-3xl mt-1">{title}</h2>
        <p className="text-sm text-muted mt-2">{t(lang, "ownerGuideLead")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const html = guideHtml(lang, data.coaching.name);
            data.rememberPrint("guide", title, html);
            setPrint(html);
          }}
        >
          <Printer className="size-4" /> {t(lang, "print")}
        </Button>
        <Link to="/setup">
          <Button size="sm" variant="secondary">
            {t(lang, "setup")}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {GUIDE_SECTIONS.map((s, i) => {
          const heading = `${i + 1}. ${s.title[lang]}`;
          const on = open === s.id;
          return (
            <Slip key={s.id} className="p-0 overflow-hidden">
              <button
                type="button"
                className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left"
                onClick={() => setOpen(on ? "" : s.id)}
              >
                <BookOpen className="size-4 shrink-0 text-teal" />
                <span className="flex-1 font-medium leading-tight">{heading}</span>
                <span className="text-muted text-sm">{on ? "−" : "+"}</span>
              </button>
              {on ? (
                <div className="border-t border-line px-4 py-3">
                  {s.body[lang].map((p, pi) => (
                    <p key={pi} className="text-sm leading-relaxed text-ink-soft mb-3 last:mb-0">
                      {p}
                    </p>
                  ))}
                </div>
              ) : null}
            </Slip>
          );
        })}
      </div>

      {print ? <PrintPreview html={print} title={title} onClose={() => setPrint(null)} /> : null}
    </div>
  );
}
