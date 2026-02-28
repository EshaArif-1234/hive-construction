import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Properties", href: "/admin/properties" },
  { label: "Investments", href: "/admin/investments" },
  { label: "Investors", href: "/admin/investors" },
  { label: "Security & Exit Plan", href: "/admin/security" },
  { label: "Reports", href: "/admin/reports" },
];

export default function AdminLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("hive_admin_token");
    if (!token) router.replace("/login?role=admin");
  }, [router.pathname]);

  const activeHref = useMemo(() => {
    return router.pathname;
  }, [router.pathname]);

  const handleLogout = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem("hive_admin_token");
    router.replace("/login?role=admin");
  };

  return (
    <div className="min-h-dvh bg-hive-light text-hive-slate">
      <div className="border-b border-hive-taupe/30 bg-hive-charcoal">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Admin Panel
            </p>
            <p className="mt-1 text-sm font-semibold text-hive-light">
              Hive Construction Ventures Advisor System
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-hive-taupe px-4 py-2 text-sm font-semibold text-hive-light transition-colors hover:bg-hive-taupe hover:text-hive-charcoal"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:px-8">
        <aside className="lg:col-span-3">
          <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-4">
            <nav className="grid gap-2">
              {navItems.map((item) => {
                const isActive = activeHref === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      "rounded-xl px-3 py-2 text-sm font-semibold transition-colors " +
                      (isActive
                        ? "bg-hive-charcoal text-hive-taupe"
                        : "text-hive-charcoal hover:bg-hive-taupe/20")
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 rounded-xl bg-hive-charcoal p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                Admin capabilities
              </p>
              <p className="mt-2 text-sm leading-6 text-hive-light/80">
                Manage property listings, investment data, cheque security, and
                reporting.
              </p>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9">{children}</main>
      </div>
    </div>
  );
}
