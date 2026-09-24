import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/pathshala/avatar";
import { CollectButton } from "@/components/pathshala/collect-dialog";
import { Slip } from "@/components/pathshala/slip";
import { useApp } from "@/lib/pathshala/store";
import { studentDue } from "@/lib/pathshala/fees";
import { hashHue, money } from "@/lib/pathshala/format";
import { t } from "@/lib/pathshala/i18n";
import { fileToJpegDataUrl } from "@/lib/pathshala/paper";
import type { Student } from "@/lib/pathshala/types";

export const Route = createFileRoute("/_app/students/")({ component: StudentsPage });

function StudentsPage() {
  const data = useApp();
  const lang = data.settings.lang;
  const [q, setQ] = useState("");
  const [hist, setHist] = useState(false);
  const [admit, setAdmit] = useState(false);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return data.students
      .filter((s) => (hist ? true : s.status === "active"))
      .filter((s) => {
        if (!n) return true;
        return [s.name, s.nameBn, s.code, s.phone, s.guardianPhone, s.school, s.guardianName]
          .join(" ")
          .toLowerCase()
          .includes(n);
      });
  }, [data.students, q, hist]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder={t(lang, "search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={() => setAdmit(true)}>{t(lang, "admit")}</Button>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={hist} onChange={(e) => setHist(e.target.checked)} />
        {t(lang, "includeHistory")}
      </label>
      <div className="flex flex-col gap-2">
        {rows.map((s) => (
          <StudentRow key={s.id} student={s} />
        ))}
        {rows.length === 0 ? <p className="text-sm text-muted">{t(lang, "noStudents")}</p> : null}
      </div>
      <Dialog open={admit} onOpenChange={setAdmit}>
        <DialogContent title={t(lang, "admit")}>
          <AdmitForm onDone={() => setAdmit(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StudentRow({ student }: { student: Student }) {
  const data = useApp();
  const lang = data.settings.lang;
  const due = studentDue(data, student.id);
  const batch = data.batches.find((b) => b.id === student.batchIds[0]);
  return (
    <Slip className="flex items-center gap-3">
      <Avatar name={student.name} hue={student.avatarHue} photo={student.photoData} />
      <div className="min-w-0 flex-1">
        <Link to="/students/$id" params={{ id: student.id }} className="font-medium hover:underline">
          {lang === "bn" ? student.nameBn : student.name}
        </Link>
        <p className="text-xs text-muted truncate">
          {student.code} · {batch?.name} · {student.school}
        </p>
      </div>
      {due > 0 ? <Badge tone="rust">{money(due, lang)}</Badge> : <Badge tone="ok">{t(lang, "paid")}</Badge>}
      {student.status !== "active" ? <Badge>{student.status}</Badge> : null}
      <CollectButton student={student} />
    </Slip>
  );
}

function AdmitForm({ onDone }: { onDone: () => void }) {
  const data = useApp();
  const lang = data.settings.lang;
  const [form, setForm] = useState({
    name: "",
    nameBn: "",
    phone: "",
    guardianName: "",
    guardianPhone: "",
    grade: "6",
    group: "none" as Student["group"],
    school: "",
    address: "",
    batchId: data.batches[0]?.id ?? "b-6",
    monthlyFee: "1800",
    admissionFee: "1200",
    notes: "",
    photoData: "",
  });

  const dup = data.students.find(
    (s) =>
      s.phone === form.phone ||
      (s.name.toLowerCase() === form.name.toLowerCase() && s.guardianPhone === form.guardianPhone),
  );

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name || !form.phone) return;
        const st = data.addStudent({
          name: form.name,
          nameBn: form.nameBn || form.name,
          phone: form.phone,
          whatsapp: form.phone,
          guardianName: form.guardianName,
          guardianPhone: form.guardianPhone || form.phone,
          grade: form.grade,
          version: "bangla",
          group: form.group,
          school: form.school,
          address: form.address,
          admissionDate: new Date().toISOString().slice(0, 10),
          admissionFee: Number(form.admissionFee) || 0,
          monthlyFee: Number(form.monthlyFee) || 0,
          status: "active",
          batchIds: [form.batchId],
          notes: form.notes,
          avatarHue: hashHue(form.name),
          photoData: form.photoData || undefined,
        });
        data.addInvoice(st.id, "admission", "Admission fee", st.admissionFee);
        toast.success(`${t(lang, "afterAdmit")} · ${st.code}`);
        onDone();
      }}
    >
      {dup ? <p className="text-sm text-amber">{t(lang, "warningDup")}</p> : null}
      <Field label={t(lang, "name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
      <Field label="বাংলা নাম" value={form.nameBn} onChange={(v) => setForm({ ...form, nameBn: v })} />
      <Field label={t(lang, "phone")} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
      <Field label={t(lang, "guardian")} value={form.guardianName} onChange={(v) => setForm({ ...form, guardianName: v })} />
      <Field
        label={`${t(lang, "guardian")} ${t(lang, "phone")}`}
        value={form.guardianPhone}
        onChange={(v) => setForm({ ...form, guardianPhone: v })}
      />
      <div>
        <Label>{t(lang, "class")}</Label>
        <Select className="mt-1" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
          {["3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((g) => (
            <option key={g} value={g}>
              Class {g}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>{t(lang, "batch")}</Label>
        <Select className="mt-1" value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}>
          {data.batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </div>
      <Field label={t(lang, "school")} value={form.school} onChange={(v) => setForm({ ...form, school: v })} />
      <Field label={t(lang, "monthly")} value={form.monthlyFee} onChange={(v) => setForm({ ...form, monthlyFee: v })} />
      <Field
        label={lang === "bn" ? "ভর্তি ফি" : "Admission fee"}
        value={form.admissionFee}
        onChange={(v) => setForm({ ...form, admissionFee: v })}
      />
      <div>
        <Label>{t(lang, "notes")}</Label>
        <Textarea className="mt-1" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <label className="text-sm text-teal">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const photoData = await fileToJpegDataUrl(file, 480);
            setForm((f) => ({ ...f, photoData }));
          }}
        />
        {lang === "bn" ? "ছবি যোগ করুন" : "Add student photo"}
        {form.photoData ? (lang === "bn" ? " · যোগ হয়েছে" : " · added") : ""}
      </label>
      <Button type="submit">{t(lang, "admit")}</Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input className="mt-1" value={value} required={required} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
