import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  LayoutGrid,
  MoreHorizontal,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/pathshala/store";
import { t } from "@/lib/pathshala/i18n";
import { SearchPalette } from "./search";
import { LockScreen } from "./lock";

const NAV = [
  { to: "/", key: "navToday" as const, icon: LayoutGrid },
  { to: "/students", key: "navStudents" as const, icon: Users },
  { to: "/fees", key: "navFees" as const, icon: Wallet },
  { to: "/routine", key: "navRoutine" as const, icon: CalendarDays },
  { to: "/more", key: "navMore" as const, icon: MoreHorizontal },
];

export function HydrateGate({ children }: { children: React.ReactNode }) {
  const hydrated = useApp((s) => s.hydrated);
  const setHydrated = useApp((s) => s.setHydrated);
  const ensureSeeded = useApp((s) => s.ensureSeeded);

  useEffect(() => {
    const result = useApp.persist.rehydrate();
    void Promise.resolve(result).then(() => {
      ensureSeeded();
      setHydrated();
    });
  }, [ensureSeeded, setHydrated]);

  if (!hydrated) {
    return (
      <div className="min-h-dvh grid place-items-center bg-navy text-cream">
        <div className="text-center">
          <p className="font-display text-4xl tracking-tight">Pathshala</p>
          <p className="mt-2 text-sm text-cream/70">Opening the desk…</p>
        </div>
      </div>
    );
  }
  return children;
}

export function AppShell() {
  const lang = useApp((s) => s.settings.lang);
  const setLang = useApp((s) => s.setLang);
  const coachingName = useApp((s) => s.coaching.name);
  const locked = useApp((s) => s.settings.locked && s.settings.pinEnabled);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const title = useMemo(() => {
    if (path.startsWith("/students")) return t(lang, "students");
    if (path.startsWith("/fees")) return t(lang, "navFees");
    if (path.startsWith("/routine")) return t(lang, "navRoutine");
    if (path.startsWith("/attendance")) return t(lang, "attendance");
    if (path.startsWith("/teachers")) return t(lang, "teachers");
    if (path.startsWith("/finance")) return t(lang, "finance");
    if (path.startsWith("/exams")) return t(lang, "exams");
    if (path.startsWith("/papers")) return t(lang, "papers");
    if (path.startsWith("/enquiries")) return t(lang, "enquiries");
    if (path.startsWith("/print")) return t(lang, "printCenter");
    if (path.startsWith("/settings")) return t(lang, "settings");
    if (path.startsWith("/setup")) return t(lang, "setup");
    if (path.startsWith("/guide")) return t(lang, "ownerGuide");
    if (path.startsWith("/more")) return t(lang, "navMore");
    return t(lang, "navToday");
  }, [path, lang]);

  if (locked) return <LockScreen />;

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <Toaster position="top-center" richColors />
      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <div className="mx-auto flex min-h-dvh max-w-6xl">
        <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-line bg-cream/80 p-4">
          <div className="px-2 pb-6">
            <p className="font-display text-2xl tracking-tight">{t(lang, "app")}</p>
            <p className="text-xs text-muted">{coachingName}</p>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm",
                  path === item.to || (item.to !== "/" && path.startsWith(item.to))
                    ? "bg-ink text-cream"
                    : "text-ink-soft hover:bg-paper-2",
                )}
              >
                <item.icon className="size-4" />
                {t(lang, item.key)}
              </Link>
            ))}
          </nav>
          <p className="mt-auto px-2 text-xs text-muted">{t(lang, "noInternet")}</p>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-navy/20 bg-navy px-4 py-3 text-cream">
            <BookOpen className="size-5 text-soft-teal md:hidden" />
            <h1 className="font-display text-lg tracking-tight text-cream">{title}</h1>
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "bn" : "en")}
              className="ml-auto flex h-11 min-w-11 items-center rounded-md border border-cream/20 bg-navy px-3 text-xs font-medium text-cream"
            >
              {lang === "en" ? "বাং" : "EN"}
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-11 min-w-11 items-center gap-2 rounded-md border border-cream/20 bg-navy px-3 text-sm text-cream/80"
            >
              <Search className="size-4" />
              <span className="hidden sm:inline">{t(lang, "search")}</span>
            </button>
          </header>
          <main className="flex-1 px-4 py-4 pb-24 md:pb-8">
            <Outlet />
          </main>
        </div>
      </div>
      <nav className="safe-bottom fixed bottom-0 inset-x-0 z-40 border-t border-line bg-cream/95 backdrop-blur-sm md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map((item) => {
            const active = path === item.to || (item.to !== "/" && path.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "text-teal" : "text-muted",
                )}
              >
                <item.icon className="size-5" />
                {t(lang, item.key)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
