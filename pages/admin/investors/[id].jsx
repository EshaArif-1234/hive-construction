import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { formatDate, formatPKR } from "@/lib/reportUi";
import { formatChequeStatus } from "@/lib/securityChequeConstants";

function StatusBadge({ status }) {
  const verified = status === "verified";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        verified ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
      }`}
    >
      {verified ? "Verified" : "Pending"}
    </span>
  );
}

export default function AdminInvestorProfilePage() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof id !== "string" || !id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/investors/${id}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(json?.message || "Unable to load profile.");
          return;
        }
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Unable to load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const profile = data?.profile;
  const summary = data?.summary;

  return (
    <>
      <Head>
        <title>
          {profile?.fullName ? `${profile.fullName} | ` : ""}Investor Profile | Hive Construction
        </title>
      </Head>

      <div className="space-y-6">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-hive-slate">
          <Link href="/admin/investors" className="font-semibold text-hive-taupe hover:text-hive-charcoal">
            Investors
          </Link>
          <span>/</span>
          <span className="font-semibold text-hive-charcoal">{profile?.fullName || "Profile"}</span>
        </nav>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-8 text-sm text-hive-slate">
            Loading investor profile…
          </div>
        ) : profile ? (
          <>
            <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Investor profile</p>
                  <h1 className="mt-3 text-2xl font-semibold text-hive-charcoal">{profile.fullName}</h1>
                  <p className="mt-1 text-sm text-hive-slate">{profile.email}</p>
                  <p className="mt-1 font-mono text-xs text-hive-slate">{profile.id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={profile.status} />
                  <Link
                    href={`/admin/reports/investors`}
                    className="rounded-md border border-hive-charcoal px-4 py-2 text-xs font-semibold text-hive-charcoal"
                  >
                    Activity report
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Total invested", formatPKR(summary?.totalInvested)],
                  ["Profit received", formatPKR(summary?.totalProfit)],
                  ["Investments", summary?.investmentCount ?? 0],
                  ["Security cheques", summary?.chequesCount ?? 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4">
                    <p className="text-[10px] font-semibold uppercase text-hive-slate/70">{label}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
                  </div>
                ))}
              </div>

              <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Phone", profile.phone || "—"],
                  ["CNIC", profile.cnic || "—"],
                  ["Address", profile.address || "—"],
                  ["Joined", formatDate(profile.joinedAt)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-hive-taupe/10 px-3 py-2">
                    <dt className="text-xs font-semibold uppercase text-hive-slate/70">{label}</dt>
                    <dd className="mt-1 text-hive-charcoal">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
                <h2 className="text-base font-semibold text-hive-charcoal">Investments</h2>
                <ul className="mt-4 space-y-3">
                  {(data?.investments || []).map((inv) => (
                    <li key={inv.id} className="rounded-xl border border-hive-taupe/15 p-4">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{inv.propertyTitle}</p>
                          <p className="text-xs text-hive-slate">
                            {formatDate(inv.investmentDate)} · {inv.status}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-semibold tabular-nums">{formatPKR(inv.amount)}</p>
                          <p className="text-xs text-emerald-800 tabular-nums">+{formatPKR(inv.profitAmount)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                  {(data?.investments || []).length === 0 ? (
                    <p className="text-sm text-hive-slate">No investments yet.</p>
                  ) : null}
                </ul>
              </div>

              <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
                <h2 className="text-base font-semibold text-hive-charcoal">Security cheques</h2>
                <ul className="mt-4 space-y-3">
                  {(data?.cheques || []).map((c) => (
                    <li key={c.id} className="rounded-xl border border-hive-taupe/15 p-4">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">#{c.chequeNumber}</p>
                          <p className="text-xs text-hive-slate">{c.propertyTitle}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-semibold tabular-nums">{formatPKR(c.principalAmount)}</p>
                          <p className="text-xs capitalize">{formatChequeStatus(c.status)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                  {(data?.cheques || []).length === 0 ? (
                    <p className="text-sm text-hive-slate">No cheques recorded.</p>
                  ) : null}
                </ul>
              </div>
            </div>

            <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
              <h2 className="text-base font-semibold text-hive-charcoal">Activity timeline</h2>
              <ul className="mt-4 space-y-3">
                {(data?.activity || []).map((event, idx) => (
                  <li key={`${event.type}-${event.date}-${idx}`} className="flex gap-4 border-l-2 border-hive-taupe/30 pl-4">
                    <div className="min-w-[90px] text-xs text-hive-slate">{formatDate(event.date)}</div>
                    <div>
                      <p className="text-sm font-medium text-hive-charcoal">{event.label}</p>
                      <p className="text-xs text-hive-slate">
                        {formatPKR(event.amount)}
                        {event.note ? ` · ${event.note}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
                {(data?.activity || []).length === 0 ? (
                  <p className="text-sm text-hive-slate">No activity recorded.</p>
                ) : null}
              </ul>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
