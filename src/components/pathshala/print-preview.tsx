import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { downloadHtml, wrapPrintHtml } from "@/components/pathshala/print";
import { t } from "@/lib/pathshala/i18n";
import { useApp } from "@/lib/pathshala/store";

export function PrintPreview({
  html,
  title,
  onClose,
}: {
  html: string;
  title: string;
  onClose: () => void;
}) {
  const lang = useApp((s) => s.settings.lang);
  const ref = useRef<HTMLIFrameElement>(null);
  const srcDoc = wrapPrintHtml(html, title);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[min(860px,calc(100%-1rem))] max-h-[92vh]" title={title}>
        <iframe
          ref={ref}
          title={title}
          srcDoc={srcDoc}
          className="mt-1 h-[62vh] w-full rounded-md border border-line bg-cream"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              const w = ref.current?.contentWindow;
              if (w) {
                w.focus();
                w.print();
              }
            }}
          >
            {t(lang, "print")}
          </Button>
          <Button variant="outline" onClick={() => downloadHtml(html, title)}>
            {t(lang, "downloadPaper")}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t(lang, "cancel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
