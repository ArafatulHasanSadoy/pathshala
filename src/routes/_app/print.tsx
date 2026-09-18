import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slip } from "@/components/pathshala/slip";
import { PrintPreview } from "@/components/pathshala/print-preview";
import { useApp } from "@/lib/pathshala/store";
import { prettyDate } from "@/lib/pathshala/format";
import { t } from "@/lib/pathshala/i18n";

export const Route = createFileRoute("/_app/print")({ component: PrintPage });

function PrintPage() {
  const data = useApp();
  const lang = data.settings.lang;
  const [preview, setPreview] = useState<{ html: string; title: string } | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">{t(lang, "printCenter")}</p>
      {data.printDocs.length === 0 ? <Slip>{t(lang, "nothing")}</Slip> : null}
      {data.printDocs.map((d) => (
        <Slip key={d.id}>
          <p className="font-medium">{d.title}</p>
          <p className="text-xs text-muted">{d.kind} · {prettyDate(d.at.slice(0, 10))}</p>
          <Button className="mt-2" size="sm" variant="outline" onClick={() => setPreview({ html: d.html, title: d.title })}>
            {t(lang, "paperPreview")}
          </Button>
        </Slip>
      ))}
      {preview ? <PrintPreview html={preview.html} title={preview.title} onClose={() => setPreview(null)} /> : null}
    </div>
  );
}
