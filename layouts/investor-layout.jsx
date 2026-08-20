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

function IconChart(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v7.125c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 20.25v-7.125zm6.75-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.25zm6.75-4.875c0-.621.504-1.125 1.125-1.125h2.25C20.496 2.25 21 2.754 21 3.375v16.5c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V3.375z" />
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

function IconShield(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconUser(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconCog(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v4.5m2.25-2.25h-4.5" />
    </svg>
  );
}

const navItems = [
  { label: "Dashboard", href: "/investor", Icon: IconDashboard },
  { label: "My Investments", href: "/investor/investments", Icon: IconChart },
  { label: "Updates", href: "/investor/updates", Icon: IconDocument },
  { label: "Exit Plan", href: "/investor/exit-plan", Icon: IconShield },
  { label: "Profile", href: "/investor/profile", Icon: IconUser },
  { label: "Settings", href: "/investor/settings", Icon: IconCog },
];

const ROUTE_META = {
  "/investor": {
    title: "Dashboard",
    subtitle: "Overview of your investments and contribution activity.",
  },
  "/investor/investments": {
    title: "My Investments",
    subtitle: "Track contributions, status, and projected outcomes.",
  },
  "/investor/updates": {
    title: "Updates",
    subtitle: "Latest project and portfolio updates.",
  },
  "/investor/exit-plan": {
    title: "Exit Plan",
    subtitle: "Review withdrawal rules and maturity timelines.",
  },
  "/investor/profile": {
    title: "Profile",
    subtitle: "Manage personal and account details.",
  },
  "/investor/settings": {
    title: "Settings",
    subtitle: "Configure account preferences and security.",
  },
};

function getRouteMeta(pathname) {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname];
  return {
    title: "Investor",
    subtitle: "Hive Construction investor portal.",
  };
}

function IconChevronRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function SidebarNav({ activeHref, onNavigate, unreadCount = 0 }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {navItems.map(({ label, href, Icon }) => {
        const isActive = activeHref === href;
        const showBadge = href === "/investor/updates" && unreadCount > 0;
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
            <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span>{label}</span>
              {showBadge && (
                <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-hive-taupe px-1.5 py-0.5 text-[10px] font-bold leading-none text-hive-charcoal">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarChrome({ activeHref, onLogout, onNavigate, unreadCount = 0 }) {
  return (
    <>
      <div className="flex h-[4.25rem] shrink-0 items-center border-b border-white/[0.08] px-5">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.25em] text-hive-taupe">
            Hive Construction
          </p>
          <p className="truncate text-sm font-semibold text-white">Investor Console</p>
        </div>
      </div>

      <SidebarNav activeHref={activeHref} onNavigate={onNavigate} unreadCount={unreadCount} />

      <div className="mt-auto space-y-2 border-t border-white/[0.08] p-4">
        <Link
          href="/"
          onClick={() => onNavigate?.()}
          className="block w-full rounded-lg border border-hive-taupe/40 bg-hive-taupe/10 px-4 py-2.5 text-center text-sm font-semibold text-hive-taupe transition-colors hover:bg-hive-taupe hover:text-hive-charcoal"
        >
          Go to website
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:border-hive-taupe/50 hover:bg-hive-taupe hover:text-hive-charcoal"
        >
          Log out
        </button>
      </div>
    </>
  );
}

export default function InvestorLayout({ children }) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const run = async () => {
      try {
        const res = await fetch("/api/auth/investor/me", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          router.replace("/login?role=investor");
        }
      } catch (e) {
        router.replace("/login?role=investor");
      }
    };

    run();
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const loadUnread = async () => {
      try {
        const res = await fetch("/api/investor/notifications?unreadOnly=true&limit=1");
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) {
          setUnreadCount(Number(data?.unreadCount) || 0);
        }
      } catch {
        if (!cancelled) setUnreadCount(0);
      }
    };

    loadUnread();
    return () => {
      cancelled = true;
    };
  }, [router.pathname]);

  const activeHref = useMemo(() => router.pathname, [router.pathname]);

  const handleLogout = () => {
    if (typeof window === "undefined") return;

    const run = async () => {
      try {
        await fetch("/api/auth/investor/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } finally {
        router.replace("/login?role=investor");
      }
    };

    run();
  };

  return (
    <div className="min-h-dvh bg-hive-light text-hive-slate">
      <div className="border-b border-hive-taupe/30 bg-hive-charcoal">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Investor Portal
            </p>
            <p className="mt-1 text-sm font-semibold text-hive-light">
              Hive Construction Ventures Advisor System
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden rounded-md border border-hive-taupe px-4 py-2 text-sm font-semibold text-hive-light transition-colors hover:bg-hive-taupe hover:text-hive-charcoal sm:inline-flex"
            >
              Go to website
            </Link>
            <Link
              href="/properties"
              className="hidden rounded-md border border-hive-taupe px-4 py-2 text-sm font-semibold text-hive-light transition-colors hover:bg-hive-taupe hover:text-hive-charcoal sm:inline-flex"
            >
              Browse Properties
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-hive-taupe px-4 py-2 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-white/10 bg-gradient-to-b from-[#0a0a0a] via-hive-charcoal to-[#050505] shadow-[4px_0_24px_rgba(0,0,0,0.12)] lg:flex">
        <SidebarChrome activeHref={activeHref} onLogout={handleLogout} unreadCount={unreadCount} />
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 max-w-[85vw] flex-col border-r border-white/10 bg-gradient-to-b from-[#0a0a0a] via-hive-charcoal to-[#050505] shadow-xl">
            <SidebarChrome
              activeHref={activeHref}
              onLogout={handleLogout}
              onNavigate={() => setMobileNavOpen(false)}
              unreadCount={unreadCount}
            />
          </aside>
        </div>
      ) : null}

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
                  <nav className="mb-1 hidden items-center gap-1.5 text-[11px] font-medium text-neutral-500 sm:flex" aria-label="Breadcrumb">
                    <Link href="/investor" className="transition-colors hover:text-hive-taupe">Investor</Link>
                    <IconChevronRight className="h-3 w-3 text-neutral-300" />
                    <span className="truncate text-neutral-700">{getRouteMeta(router.pathname).title}</span>
                  </nav>
                  <h1 className="truncate text-lg font-bold tracking-tight text-hive-charcoal sm:text-xl">{getRouteMeta(router.pathname).title}</h1>
                  <p className="hidden max-w-2xl text-sm leading-snug text-neutral-500 sm:line-clamp-2 sm:block">
                    {getRouteMeta(router.pathname).subtitle}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href="/"
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-hive-charcoal shadow-sm transition-colors hover:border-hive-taupe hover:bg-hive-taupe/10"
                >
                  Go to website
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-hive-charcoal shadow-sm transition-colors hover:border-hive-taupe hover:bg-hive-taupe/10"
                >
                  Log out
                </button>
              </div>
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
