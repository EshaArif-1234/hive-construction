import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";

const navItems = [
  { label: "Dashboard", href: "/investor" },
  { label: "My Investments", href: "/investor/investments" },
  { label: "Updates", href: "/investor/updates" },
  { label: "Exit Plan", href: "/investor/exit-plan" },
  { label: "Profile", href: "/investor/profile" },
  { label: "Settings", href: "/investor/settings" },
];

export default function InvestorLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("hive_investor_token");
    if (!token) {
      router.replace("/login?role=investor");
    }
  }, [router]);

  const activeHref = useMemo(() => router.pathname, [router.pathname]);

  const handleLogout = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem("hive_investor_token");
    router.push("/login?role=investor");
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
                Your access
              </p>
              <p className="mt-2 text-sm leading-6 text-hive-light/80">
                Track contributions, profit share, project status updates, and exit
                plan details.
              </p>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9">{children}</main>
      </div>
    </div>
  );
}
