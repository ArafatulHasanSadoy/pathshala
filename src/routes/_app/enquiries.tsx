import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Slip } from "@/components/pathshala/slip";
import { useApp } from "@/lib/pathshala/store";
import { hashHue, prettyDate, telHref, waHref } from "@/lib/pathshala/format";
import { t } from "@/lib/pathshala/i18n";
import type { Enquiry } from "@/lib/pathshala/types";

export const Route = createFileRoute("/_app/enquiries")({ component: EnquiriesPage });

function EnquiriesPage() {
  const data = useApp();
  const lang = data.settings.lang;
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const openRows = data.enquiries.filter((e) => e.status === "open");
  const joined = data.enquiries.filter((e) => e.status === "joined").length;
  const conv = data.enquiries.length ? Math.round((joined / data.enquiries.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {t(lang, "convertRate")} {conv}% · {openRows.length} open
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>{t(lang, "newEnquiry")}</Button>
      </div>
      {openRows.map((e) => (
        <Slip key={e.id}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{e.studentName}</p>
              <p className="text-sm text-muted">
                Class {e.classGrade} · {e.school} · {e.source}
              </p>
              <p className="text-sm mt-1">{e.notes}</p>
              {e.followUpDate ? (
                <p className="text-xs text-amber mt-1">{t(lang, "followUp")} {prettyDate(e.followUpDate)}</p>
              ) : null}
            </div>
            <Badge tone={e.followUpDate && e.followUpDate <= new Date().toISOString().slice(0, 10) ? "rust" : "muted"}>
              {e.status}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={telHref(e.phone)}><Button size="sm" variant="outline">{t(lang, "call")}</Button></a>
            <a href={waHref(e.phone, `Advance Educare — Class ${e.classGrade}`)} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline">{t(lang, "whatsapp")}</Button>
            </a>
            <Button
              size="sm"
              onClick={() => {
                const st = data.addStudent({
                  name: e.studentName,
                  nameBn: e.studentName,
                  phone: e.phone,
                  whatsapp: e.phone,
                  guardianName: e.guardianName,
                  guardianPhone: e.phone,
                  grade: e.classGrade,
                  version: "bangla",
                  group: "none",
                  school: e.school,
                  address: "",
                  admissionDate: new Date().toISOString().slice(0, 10),
                  admissionFee: 1200,
                  monthlyFee: 1800,
                  status: "active",
                  batchIds: e.interestedBatchId ? [e.interestedBatchId] : [data.batches[0]?.id ?? "b-35"],
                  notes: e.notes,
                  avatarHue: hashHue(e.studentName),
                });
                data.updateEnquiry(e.id, { status: "joined" });
                toast.success(st.code);
                void nav({ to: "/students/$id", params: { id: st.id } });
              }}
            >
              {t(lang, "convert")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => data.updateEnquiry(e.id, { status: "lost" })}>
              Lost
            </Button>
          </div>
        </Slip>
      ))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={t(lang, "newEnquiry")}>
          <NewEnquiry onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewEnquiry({ onDone }: { onDone: () => void }) {
  const data = useApp();
  const lang = data.settings.lang;
  const [f, setF] = useState({
    studentName: "",
    phone: "",
    guardianName: "",
    classGrade: "6",
    school: "",
    interestedBatchId: "",
    source: "walkin" as Enquiry["source"],
    followUpDate: "",
    notes: "",
  });
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        data.addEnquiry({
          ...f,
          interestedBatchId: f.interestedBatchId || null,
          followUpDate: f.followUpDate || null,
        });
        onDone();
      }}
    >
      <Field label={t(lang, "name")} value={f.studentName} on={(v) => setF({ ...f, studentName: v })} />
      <Field label={t(lang, "phone")} value={f.phone} on={(v) => setF({ ...f, phone: v })} />
      <Field label={t(lang, "guardian")} value={f.guardianName} on={(v) => setF({ ...f, guardianName: v })} />
      <Field label={t(lang, "class")} value={f.classGrade} on={(v) => setF({ ...f, classGrade: v })} />
      <Field label={t(lang, "school")} value={f.school} on={(v) => setF({ ...f, school: v })} />
      <div>
        <Label>{t(lang, "source")}</Label>
        <Select className="mt-1" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value as Enquiry["source"] })}>
          <option value="walkin">{t(lang, "walkin")}</option>
          <option value="phone">{t(lang, "phone")}</option>
          <option value="referral">{t(lang, "referral")}</option>
        </Select>
      </div>
      <Field label={t(lang, "followUp")} value={f.followUpDate} on={(v) => setF({ ...f, followUpDate: v })} />
      <div>
        <Label>{t(lang, "notes")}</Label>
        <Textarea className="mt-1" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </div>
      <Button type="submit">{t(lang, "save")}</Button>
    </form>
  );
}

function Field({ label, value, on }: { label: string; value: string; on: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1" value={value} onChange={(e) => on(e.target.value)} />
    </div>
  );
}
