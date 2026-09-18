export function wrapPrintHtml(innerHtml: string, title: string) {
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title.replace(/</g, "")}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&family=Noto+Serif+Bengali:wght@500;600&family=Noto+Sans:wght@400;600&display=swap"/>
    <style>
      @page { size: A4; margin: 12mm; }
      html, body { margin: 0; background: #fff; }
      body { font-family: "Noto Sans", "Noto Sans Bengali", Georgia, serif; color: #1c2430; padding: 8mm; }
      h1,h2,h3 { font-family: "Noto Serif Bengali", Georgia, serif; }
      @media print { body { padding: 0; } .no-print { display: none !important; } }
    </style></head><body>${innerHtml}</body></html>`;
}

export function openPrintWindow(innerHtml: string, title: string) {
  const html = wrapPrintHtml(innerHtml, title);
  const w = window.open("", "_blank", "noopener,width=900,height=1100");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => setTimeout(() => w.print(), 250);
  return true;
}

export function downloadHtml(innerHtml: string, title: string) {
  const blob = new Blob([wrapPrintHtml(innerHtml, title)], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${title.replace(/[^\w\-]+/g, "_").slice(0, 48) || "document"}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
