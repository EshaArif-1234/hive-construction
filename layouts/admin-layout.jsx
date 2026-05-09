import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

function IconDashboard(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25z" />
    </svg>
  );
}

function IconBuilding(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function IconChart(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v7.125c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 20.25v-7.125zm6.75-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.25zm6.75-4.875c0-.621.504-1.125 1.125-1.125h2.25C20.496 2.25 21 2.754 21 3.375v16.5c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V3.375z" />
    </svg>
  );
}

function IconUsers(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconShield(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconDocument(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

const navItems = [
  { label: "Dashboard", href: "/admin", Icon: IconDashboard },
  { label: "Properties", href: "/admin/properties", Icon: IconBuilding },
  { label: "Investments", href: "/admin/investments", Icon: IconChart },
  { label: "Investors", href: "/admin/investors", Icon: IconUsers },
  { label: "Security & Exit Plan", href: "/admin/security", Icon: IconShield },
  { label: "Reports", href: "/admin/reports", Icon: IconDocument },
];

const ROUTE_META = {
  "/admin": {
    title: "Dashboard",
    subtitle: "Overview, metrics, and quick access to core workflows.",
  },
  "/admin/properties": {
    title: "Properties",
    subtitle: "Create and manage listings, pricing, media, and availability.",
  },
  "/admin/investments": {
    title: "Investments",
    subtitle: "Track allocations and investment records across projects.",
  },
  "/admin/investors": {
    title: "Investors",
    subtitle: "Review accounts, verification status, and onboarding.",
  },
  "/admin/security": {
    title: "Security & exit plan",
    subtitle: "Cheque security, exit rules, and compliance notes.",
  },
  "/admin/reports": {
    title: "Reports",
    subtitle: "Exports and summaries for stakeholders.",
  },
};

function getRouteMeta(pathname) {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname];
  return {
    title: "Admin",
    subtitle: "Hive Construction admin console.",
  };
}

function IconChevronRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function SidebarNav({ activeHref, onNavigate }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
        Menu
      </p>
      {navItems.map(({ label, href, Icon }) => {
        const isActive = activeHref === href;

        return (
          <Link
            key={href}
            href={href}
            onClick={() => onNavigate?.()}
            className={
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " +
              (isActive
                ? "border-l-2 border-hive-taupe bg-white/[0.08] text-hive-taupe shadow-inner"
                : "border-l-2 border-transparent text-white/75 hover:bg-white/[0.06] hover:text-white")
            }
          >
            <Icon
              className={
                "h-5 w-5 shrink-0 transition-colors " +
                (isActive ? "text-hive-taupe" : "text-white/45 group-hover:text-white/70")
              }
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarChrome({ activeHref, onLogout, showFooterCard, onNavigate }) {
  return (
    <>
      <div className="flex h-[4.25rem] shrink-0 items-center border-b border-white/[0.08] px-5">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.25em] text-hive-taupe">
            Hive Construction
          </p>
          <p className="truncate text-sm font-semibold text-white">Admin Console</p>
        </div>
      </div>

      <SidebarNav activeHref={activeHref} onNavigate={onNavigate} />

      {showFooterCard ? (
        <div className="mx-3 mb-3 rounded-xl border border-white/[0.06] bg-white/[0.04] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-taupe/90">
            Overview
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/55">
            Manage listings, investors, investments, and compliance from one place.
          </p>
        </div>
      ) : null}

      <div className="mt-auto border-t border-white/[0.08] p-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-hive-taupe/50 hover:bg-hive-taupe hover:text-hive-charcoal"
        >
          Log out
        </button>
      </div>
    </>
  );
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/auth/admin/me");
        if (!res.ok) {
          if (!cancelled) router.replace("/login?role=admin");
        }
      } catch {
        if (!cancelled) router.replace("/login?role=admin");
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [router.pathname, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  const activeHref = useMemo(() => router.pathname, [router.pathname]);

  const headerMeta = useMemo(() => getRouteMeta(router.pathname), [router.pathname]);

  const dateDisplay = useMemo(() => {
    return new Intl.DateTimeFormat("en-PK", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
  }, []);

  const handleLogout = () => {
    if (typeof window === "undefined") return;
    const run = async () => {
      try {
        await fetch("/api/auth/admin/logout", { method: "POST" });
      } catch {
        // ignore
      } finally {
        router.replace("/login?role=admin");
      }
    };
    run();
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="min-h-dvh bg-[#f7f7f5] text-hive-slate">
      {/* Desktop: fixed left sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-white/10 bg-gradient-to-b from-[#0a0a0a] via-hive-charcoal to-[#050505] shadow-[4px_0_24px_rgba(0,0,0,0.12)] lg:flex">
        <SidebarChrome activeHref={activeHref} onLogout={handleLogout} showFooterCard />
      </aside>

      {/* Mobile overlay */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={closeMobileNav}
          />
          <aside
            id="admin-mobile-nav"
            className="absolute left-0 top-0 flex h-full w-64 max-w-[85vw] flex-col border-r border-white/10 bg-gradient-to-b from-[#0a0a0a] via-hive-charcoal to-[#050505] shadow-xl"
          >
            <SidebarChrome
              activeHref={activeHref}
              onLogout={handleLogout}
              showFooterCard={false}
              onNavigate={closeMobileNav}
            />
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <header className="sticky top-0 z-30 shrink-0 border-b border-neutral-200/90 bg-white/95 shadow-[0_1px_0_rgba(0,0,0,0.03)] backdrop-blur-xl">
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-hive-taupe/35 to-transparent" />
            <div className="flex min-h-[4.25rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
                <button
                  type="button"
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200/90 bg-white text-hive-charcoal shadow-sm transition-colors hover:border-hive-taupe/40 hover:bg-neutral-50 lg:hidden"
                  aria-expanded={mobileNavOpen}
                  aria-label="Open navigation menu"
                  onClick={() => setMobileNavOpen(true)}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </button>

                <div className="min-w-0 flex-1">
                  <nav
                    className="mb-1 hidden items-center gap-1.5 text-[11px] font-medium text-neutral-500 sm:flex"
                    aria-label="Breadcrumb"
                  >
                    <Link
                      href="/admin"
                      className="transition-colors hover:text-hive-taupe"
                    >
                      Admin
                    </Link>
                    {router.pathname !== "/admin" ? (
                      <>
                        <IconChevronRight className="h-3 w-3 text-neutral-300" />
                        <span className="truncate text-neutral-700">{headerMeta.title}</span>
                      </>
                    ) : (
                      <>
                        <IconChevronRight className="h-3 w-3 text-neutral-300" />
                        <span className="text-neutral-700">Overview</span>
                      </>
                    )}
                  </nav>

                  <div className="flex flex-col gap-0.5 sm:gap-1">
                    <h1 className="truncate text-lg font-bold tracking-tight text-hive-charcoal sm:text-xl">
                      {headerMeta.title}
                    </h1>
                    <p className="hidden max-w-2xl text-sm leading-snug text-neutral-500 sm:line-clamp-2 sm:block">
                      {headerMeta.subtitle}
                    </p>
                  </div>

                  <p className="mt-0.5 truncate text-[11px] text-neutral-400 sm:hidden">
                    Hive Construction · Admin
                  </p>
                </div>
              </div>

              <div className="hidden shrink-0 flex-row items-center gap-4 lg:flex">
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    Today
                  </p>
                  <p className="text-xs font-semibold tabular-nums text-hive-charcoal">{dateDisplay}</p>
                </div>
                <span className="hidden rounded-full border border-neutral-200/90 bg-neutral-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-600 xl:inline-flex">
                  Administrator
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-hive-charcoal shadow-sm transition-colors hover:border-hive-taupe hover:bg-hive-taupe/10"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Log out
                </button>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="shrink-0 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-hive-charcoal shadow-sm transition-colors hover:border-hive-taupe hover:bg-hive-taupe/10 lg:hidden"
              >
                Log out
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
