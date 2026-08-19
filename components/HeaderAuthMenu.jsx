import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { getUserInitials } from "@/lib/userInitials";

export default function HeaderAuthMenu() {
  const router = useRouter();
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      setLoading(true);
      try {
        const [investorRes, adminRes] = await Promise.all([
          fetch("/api/auth/investor/me"),
          fetch("/api/auth/admin/me"),
        ]);

        const investorData = investorRes.ok ? await investorRes.json().catch(() => ({})) : null;
        const adminData = adminRes.ok ? await adminRes.json().catch(() => ({})) : null;

        if (cancelled) return;

        if (adminData?.admin?.email) {
          setSession({
            role: "admin",
            label: adminData.admin.email,
            initials: getUserInitials({ email: adminData.admin.email }),
            dashboardHref: "/admin",
            logoutUrl: "/api/auth/admin/logout",
          });
          return;
        }

        if (investorData?.investor) {
          const { fullName, email } = investorData.investor;
          setSession({
            role: "investor",
            label: fullName || email,
            initials: getUserInitials({ fullName, email }),
            dashboardHref: "/investor",
            logoutUrl: "/api/auth/investor/logout",
          });
          return;
        }

        setSession(null);
      } catch {
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [router.pathname]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLogout = useCallback(async () => {
    if (!session || loggingOut) return;

    setLoggingOut(true);
    try {
      await fetch(session.logoutUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // continue to clear UI even if request fails
    } finally {
      setOpen(false);
      setSession(null);
      setLoggingOut(false);
      router.push("/");
    }
  }, [loggingOut, router, session]);

  if (loading) {
    return (
      <div
        className="h-10 w-10 rounded-full border border-hive-taupe/30 bg-hive-slate/40"
        aria-hidden
      />
    );
  }

  if (!session) {
    return (
      <>
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-md border border-hive-taupe px-4 py-2 text-sm font-semibold text-hive-light transition-colors hover:bg-hive-taupe hover:text-hive-charcoal"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-hive-taupe px-4 py-2 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
          >
            Sign Up
          </Link>
        </div>

        <div className="flex items-center md:hidden">
          <Link
            href="/login"
            className="rounded-md bg-hive-taupe px-3 py-2 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
          >
            Login
          </Link>
        </div>
      </>
    );
  }

  const roleLabel = session.role === "admin" ? "Admin" : "Investor";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-hive-taupe/50 bg-hive-taupe text-sm font-bold text-hive-charcoal transition-colors hover:bg-hive-light focus:outline-none focus-visible:ring-2 focus-visible:ring-hive-taupe focus-visible:ring-offset-2 focus-visible:ring-offset-hive-charcoal"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${roleLabel} account menu`}
        title={session.label}
      >
        {session.initials}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-hive-taupe/20 bg-hive-light shadow-lg"
        >
          <div className="border-b border-hive-taupe/15 px-4 py-3">
            <p className="truncate text-sm font-semibold text-hive-charcoal">{session.label}</p>
            <p className="mt-0.5 text-xs text-hive-slate">{roleLabel} account</p>
          </div>

          <div className="p-1.5">
            <Link
              href={session.dashboardHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-hive-charcoal transition-colors hover:bg-hive-taupe/15"
            >
              Go to dashboard
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Logging out…" : "Logout"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
