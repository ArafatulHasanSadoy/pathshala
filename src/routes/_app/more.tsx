import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookMarked,
  ClipboardList,
  FileText,
  Printer,
  Settings,
  UserRound,
  WalletCards,
  Inbox,
  School,
} from "lucide-react";
import { Slip } from "@/components/pathshala/slip";
import { useApp } from "@/lib/pathshala/store";
import { t } from "@/lib/pathshala/i18n";

export const Route = createFileRoute("/_app/more")({ component: MorePage });

const ITEMS = [
  { to: "/setup", key: "setup" as const, icon: School },
  { to: "/teachers", key: "teachers" as const, icon: UserRound },
  { to: "/enquiries", key: "enquiries" as const, icon: Inbox },
  { to: "/finance", key: "finance" as const, icon: WalletCards },
  { to: "/exams", key: "exams" as const, icon: ClipboardList },
  { to: "/papers", key: "papers" as const, icon: FileText },
  { to: "/print", key: "printCenter" as const, icon: Printer },
  { to: "/attendance", key: "attendance" as const, icon: BookMarked },
  { to: "/settings", key: "settings" as const, icon: Settings },
];

function MorePage() {
  const lang = useApp((s) => s.settings.lang);
  return (
    <div className="grid grid-cols-2 gap-3">
      {ITEMS.map((item) => (
        <Link key={item.to} to={item.to}>
          <Slip className="flex min-h-24 flex-col justify-between">
            <item.icon className="size-5 text-teal" />
            <p className="font-medium">{t(lang, item.key)}</p>
          </Slip>
        </Link>
      ))}
      <Slip className="col-span-2">
        <p className="text-sm text-muted">{t(lang, "moreSoon")}</p>
      </Slip>
    </div>
  );
}
