import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/StatusBadge";

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "investment", label: "Investment" },
  { id: "property-status", label: "Property Status" },
  { id: "profit-share", label: "Profit Share" },
  { id: "security", label: "Security" },
  { id: "account", label: "Account" },
];

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function typeLabel(type) {
  const match = TYPE_FILTERS.find((row) => row.id === type);
  return match?.label || type;
}

export default function InvestorUpdatesPage() {
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (filter !== "all") params.set("type", filter);

      const res = await fetch(`/api/investor/notifications?${params.toString()}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Unable to load updates.");
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadCount(Number(data?.unreadCount) || 0);
    } catch {
      setError("Unable to load updates.");
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const visibleUnread = useMemo(
    () => notifications.filter((row) => !row.isRead).length,
    [notifications]
  );

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    setError("");
    try {
      const res = await fetch("/api/investor/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to mark notifications as read.");
        return;
      }
      await loadNotifications();
    } catch {
      setError("Unable to mark notifications as read.");
    } finally {
      setMarkingRead(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const res = await fetch("/api/investor/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!res.ok) return;
      setNotifications((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, isRead: true, readAt: new Date().toISOString() } : row
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silent — user can retry via mark all.
    }
  };

  return (
    <>
      <Head>
        <title>Updates | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Notifications
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
              Updates
            </h1>
            <p className="mt-2 text-sm leading-6 text-hive-slate">
              Investment confirmations, property status changes, profit-share distributions, and
              security cheque updates.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingRead}
              className="shrink-0 rounded-xl border border-hive-taupe/40 bg-white px-4 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-taupe/10 disabled:opacity-60"
            >
              {markingRead ? "Marking…" : `Mark all read (${unreadCount})`}
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TYPE_FILTERS.map(({ id, label }) => {
            const active = filter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors " +
                  (active
                    ? "bg-hive-charcoal text-hive-taupe"
                    : "border border-hive-taupe/30 bg-white text-hive-slate hover:border-hive-taupe/60")
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-sm text-hive-slate">Loading updates…</p>
        ) : notifications.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-hive-taupe/30 bg-white/60 p-8 text-center">
            <p className="text-sm font-semibold text-hive-charcoal">No updates yet</p>
            <p className="mt-2 text-sm text-hive-slate">
              When you invest or when admin records profit, property changes, or security cheques,
              notifications will appear here.
            </p>
            <Link
              href="/properties"
              className="mt-4 inline-flex rounded-xl bg-hive-charcoal px-4 py-2.5 text-sm font-semibold text-hive-taupe transition-colors hover:bg-hive-slate"
            >
              Browse properties
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {notifications.map((row) => {
              const card = (
                <div
                  className={
                    "rounded-2xl border p-6 transition-colors " +
                    (row.isRead
                      ? "border-hive-taupe/15 bg-white/70"
                      : "border-hive-taupe/30 bg-white shadow-sm")
                  }
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {!row.isRead && (
                          <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-hive-taupe" />
                        )}
                        <p className="text-sm font-semibold text-hive-charcoal">
                          {typeLabel(row.type)} • {row.title}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-hive-slate">{formatDate(row.createdAt)}</p>
                    </div>
                    <StatusBadge status={row.isRead ? "Read" : "New"} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-hive-slate">{row.message}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {row.link && (
                      <Link
                        href={row.link}
                        className="text-sm font-semibold text-hive-charcoal underline decoration-hive-taupe/50 underline-offset-2 hover:decoration-hive-taupe"
                      >
                        View details
                      </Link>
                    )}
                    {!row.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(row.id)}
                        className="text-sm font-semibold text-hive-slate hover:text-hive-charcoal"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              );

              return <div key={row.id}>{card}</div>;
            })}
          </div>
        )}

        {!loading && visibleUnread > 0 && filter !== "all" && (
          <p className="mt-4 text-xs text-hive-slate">
            {visibleUnread} unread in this filter.{" "}
            {unreadCount > visibleUnread && `${unreadCount} unread overall.`}
          </p>
        )}
      </div>
    </>
  );
}
