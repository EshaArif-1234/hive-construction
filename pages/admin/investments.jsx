import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";

function formatPKR(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `PKR ${Math.round(x).toLocaleString("en-PK")}`;
}

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

function formatPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${x.toFixed(2)}%`;
}

function InvestmentStatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  const label =
    s === "active" ? "Active" : s === "withdrawn" ? "Withdrawn" : s === "completed" ? "Completed" : status || "—";
  const cls =
    s === "active"
      ? "bg-emerald-100 text-emerald-900"
      : s === "completed"
        ? "bg-sky-100 text-sky-900"
        : s === "withdrawn"
          ? "bg-amber-100 text-amber-900"
          : "bg-neutral-200 text-neutral-800";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export default function AdminInvestmentsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [investments, setInvestments] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [properties, setProperties] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [newInvestorId, setNewInvestorId] = useState("");
  const [newPropertyId, setNewPropertyId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newInvestmentDate, setNewInvestmentDate] = useState("");

  const [profitModalInv, setProfitModalInv] = useState(null);
  const [profitAmountInput, setProfitAmountInput] = useState("");
  const [profitStatusInput, setProfitStatusInput] = useState("active");
  const [profitSubmitting, setProfitSubmitting] = useState(false);
  const [profitError, setProfitError] = useState("");

  const [viewModalInv, setViewModalInv] = useState(null);

  const loadInvestments = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const qs = statusFilter !== "all" ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const res = await fetch(`/api/admin/investments${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to load investments.");
        setInvestments([]);
        return;
      }
      setInvestments(Array.isArray(data?.investments) ? data.investments : []);
    } catch {
      setError("Unable to load investments.");
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadLookups = useCallback(async () => {
    try {
      const [invRes, propRes] = await Promise.all([
        fetch("/api/admin/investors"),
        fetch("/api/admin/properties"),
      ]);
      const invData = await invRes.json().catch(() => ({}));
      const propData = await propRes.json().catch(() => ({}));
      if (invRes.ok) {
        setInvestors(Array.isArray(invData?.investors) ? invData.investors : []);
      }
      if (propRes.ok) {
        setProperties(Array.isArray(propData?.properties) ? propData.properties : []);
      }
    } catch {
      // non-fatal for list
    }
  }, []);

  useEffect(() => {
    loadInvestments();
  }, [loadInvestments]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  const openAddModal = () => {
    setAddError("");
    setNewInvestorId("");
    setNewPropertyId("");
    setNewAmount("");
    setNewInvestmentDate("");
    setShowAddModal(true);
    loadLookups();
  };

  const onAddSubmit = async (e) => {
    e.preventDefault();
    setAddError("");
    if (addSubmitting) return;
    if (!newInvestorId || !newPropertyId) {
      setAddError("Select an investor and a property.");
      return;
    }
    const amt = Number(newAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setAddError("Enter a valid amount.");
      return;
    }
    setAddSubmitting(true);
    try {
      const body = {
        investorId: newInvestorId,
        propertyId: newPropertyId,
        amount: amt,
      };
      if (newInvestmentDate) {
        body.investmentDate = new Date(newInvestmentDate).toISOString();
      }
      const res = await fetch("/api/admin/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(data?.message || "Unable to create investment.");
        return;
      }
      if (data?.investment) {
        setInvestments((prev) => [data.investment, ...prev]);
      } else {
        await loadInvestments();
      }
      setShowAddModal(false);
    } catch {
      setAddError("Unable to create investment.");
    } finally {
      setAddSubmitting(false);
    }
  };

  const openProfitModal = (row) => {
    setProfitError("");
    setProfitModalInv(row);
    setProfitAmountInput(row?.profitAmount != null ? String(row.profitAmount) : "0");
    setProfitStatusInput(row?.status || "active");
  };

  const closeProfitModal = () => {
    if (profitSubmitting) return;
    setProfitModalInv(null);
  };

  const onProfitSubmit = async (e) => {
    e.preventDefault();
    if (!profitModalInv?.id || profitSubmitting) return;
    const p = Number(profitAmountInput);
    if (!Number.isFinite(p) || p < 0) {
      setProfitError("Profit amount must be zero or greater.");
      return;
    }
    setProfitError("");
    setProfitSubmitting(true);
    try {
      const res = await fetch(`/api/admin/investments/${profitModalInv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profitAmount: p,
          status: profitStatusInput,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfitError(data?.message || "Unable to update.");
        return;
      }
      if (data?.investment) {
        setInvestments((prev) =>
          prev.map((x) => (x.id === data.investment.id ? data.investment : x))
        );
      } else {
        await loadInvestments();
      }
      setProfitModalInv(null);
    } catch {
      setProfitError("Unable to update.");
    } finally {
      setProfitSubmitting(false);
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return investments.filter((x) => {
      if (!q) return true;
      const hay = `${x.id} ${x.investorName} ${x.investorEmail} ${x.propertyTitle} ${x.propertyLocation}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, investments]);

  const totals = useMemo(() => {
    let principal = 0;
    let profit = 0;
    for (const x of investments) {
      principal += Number(x.amount) || 0;
      profit += Number(x.profitAmount) || 0;
    }
    return { principal, profit };
  }, [investments]);

  return (
    <>
      <Head>
        <title>Admin Investments | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Investment Data
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
              Investments
            </h1>
            <p className="mt-2 text-sm leading-6 text-hive-slate">
              Track contributions, dates, recorded profit distributions, and status. Share % is derived from
              amount ÷ property total cost.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
          >
            Add Investment
          </button>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-hive-taupe/15 bg-neutral-50 p-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">
              Total principal (listed)
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-hive-charcoal">{formatPKR(totals.principal)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">
              Profit recorded (sum)
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-hive-charcoal">{formatPKR(totals.profit)}</p>
          </div>
          <div className="rounded-xl bg-hive-charcoal px-4 py-3 text-hive-light">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-taupe">Profit framework</p>
            <p className="mt-1 text-xs leading-relaxed text-white/85">
              75% investors / 25% Hive applies when allocating project profit; enter each investor’s distributed profit in “Record profit”.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe sm:col-span-2"
            placeholder="Search by investor, property, investment id"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="completed">Completed</option>
          </select>

          <div className="rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-slate">
            {loading ? (
              <span className="font-semibold text-hive-charcoal">Loading…</span>
            ) : (
              <>
                Showing <span className="font-semibold text-hive-charcoal">{rows.length}</span>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-hive-taupe/20">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-hive-charcoal">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Investment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Investor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Property
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Share
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Profit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((x) => (
                  <tr key={x.id} className="odd:bg-hive-light even:bg-white/80">
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <p className="font-mono text-xs text-hive-slate">{x.id}</p>
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <p className="text-sm font-semibold text-hive-charcoal">{x.investorName}</p>
                      <p className="mt-0.5 text-xs text-hive-slate">{x.investorEmail}</p>
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <p className="text-sm font-semibold text-hive-charcoal">{x.propertyTitle}</p>
                      <p className="mt-0.5 text-xs text-hive-slate">{x.propertyLocation}</p>
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm font-semibold tabular-nums text-hive-charcoal">
                      {formatPKR(x.amount)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm tabular-nums text-hive-slate">
                      {formatPct(x.sharePercentage)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm font-semibold tabular-nums text-emerald-800">
                      {formatPKR(x.profitAmount)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm text-hive-slate">
                      {formatDate(x.investmentDate)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <InvestmentStatusPill status={x.status} />
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewModalInv(x)}
                          className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openProfitModal(x)}
                          className="rounded-md bg-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-light transition-colors hover:text-hive-taupe"
                        >
                          Record profit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="border-t border-hive-taupe/20 px-4 py-10 text-center text-sm text-hive-slate"
                    >
                      No investments match your filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="my-auto w-full max-w-lg rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Manual entry</p>
                <h2 className="mt-2 text-xl font-semibold text-hive-charcoal">Add investment</h2>
                <p className="mt-1 text-sm text-hive-slate">
                  Link a verified investor to a property and record the contribution amount.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !addSubmitting && setShowAddModal(false)}
                className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-charcoal hover:border-hive-taupe"
              >
                Close
              </button>
            </div>

            <form onSubmit={onAddSubmit} className="mt-6 grid gap-4">
              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Investor</label>
                <select
                  required
                  value={newInvestorId}
                  onChange={(e) => setNewInvestorId(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                >
                  <option value="">Select investor</option>
                  {investors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.fullName} ({i.email}) — {i.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Property</label>
                <select
                  required
                  value={newPropertyId}
                  onChange={(e) => setNewPropertyId(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                >
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — {p.location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Amount (PKR)</label>
                <input
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                  inputMode="decimal"
                  placeholder="500000"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Investment date (optional)</label>
                <input
                  type="date"
                  value={newInvestmentDate}
                  onChange={(e) => setNewInvestmentDate(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                />
              </div>

              {addError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{addError}</div>
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !addSubmitting && setShowAddModal(false)}
                  className="rounded-md border border-hive-charcoal px-4 py-2 text-sm font-semibold text-hive-charcoal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="rounded-md bg-hive-charcoal px-5 py-2 text-sm font-semibold text-hive-light disabled:opacity-60"
                >
                  {addSubmitting ? "Saving…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {profitModalInv ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="my-auto w-full max-w-md rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Profit distribution</p>
                <h2 className="mt-2 text-lg font-semibold text-hive-charcoal">Record profit</h2>
                <p className="mt-1 text-xs text-hive-slate">
                  Store cumulative profit allocated to this investor for this stake (PKR).
                </p>
              </div>
              <button
                type="button"
                onClick={closeProfitModal}
                className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-charcoal"
              >
                Close
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-hive-taupe/15 bg-neutral-50 p-3 text-xs text-hive-slate">
              <p>
                <span className="font-semibold text-hive-charcoal">{profitModalInv.investorName}</span> ·{" "}
                {profitModalInv.propertyTitle}
              </p>
              <p className="mt-1">
                Principal: {formatPKR(profitModalInv.amount)} · Share {formatPct(profitModalInv.sharePercentage)}
              </p>
            </div>

            <form onSubmit={onProfitSubmit} className="mt-4 grid gap-4">
              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Profit allocated (PKR)</label>
                <input
                  value={profitAmountInput}
                  onChange={(e) => setProfitAmountInput(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                  inputMode="decimal"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Status</label>
                <select
                  value={profitStatusInput}
                  onChange={(e) => setProfitStatusInput(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                >
                  <option value="active">Active</option>
                  <option value="withdrawn">Withdrawn</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {profitError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{profitError}</div>
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeProfitModal}
                  className="rounded-md border border-hive-charcoal px-4 py-2 text-sm font-semibold text-hive-charcoal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profitSubmitting}
                  className="rounded-md bg-hive-charcoal px-5 py-2 text-sm font-semibold text-hive-light disabled:opacity-60"
                >
                  {profitSubmitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {viewModalInv ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="my-auto w-full max-w-lg rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-hive-charcoal">Investment details</h2>
              <button
                type="button"
                onClick={() => setViewModalInv(null)}
                className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-charcoal"
              >
                Close
              </button>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-hive-taupe/10 pb-2">
                <dt className="text-hive-slate">ID</dt>
                <dd className="font-mono text-xs text-hive-charcoal">{viewModalInv.id}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-hive-taupe/10 pb-2">
                <dt className="text-hive-slate">Investor</dt>
                <dd className="text-right font-semibold text-hive-charcoal">{viewModalInv.investorName}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-hive-taupe/10 pb-2">
                <dt className="text-hive-slate">Email</dt>
                <dd className="text-right text-hive-charcoal">{viewModalInv.investorEmail || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-hive-taupe/10 pb-2">
                <dt className="text-hive-slate">Property</dt>
                <dd className="text-right font-semibold text-hive-charcoal">{viewModalInv.propertyTitle}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-hive-taupe/10 pb-2">
                <dt className="text-hive-slate">Amount</dt>
                <dd className="font-semibold tabular-nums text-hive-charcoal">{formatPKR(viewModalInv.amount)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-hive-taupe/10 pb-2">
                <dt className="text-hive-slate">Share</dt>
                <dd className="tabular-nums">{formatPct(viewModalInv.sharePercentage)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-hive-taupe/10 pb-2">
                <dt className="text-hive-slate">Profit recorded</dt>
                <dd className="font-semibold tabular-nums text-emerald-800">{formatPKR(viewModalInv.profitAmount)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-hive-taupe/10 pb-2">
                <dt className="text-hive-slate">Investment date</dt>
                <dd>{formatDate(viewModalInv.investmentDate)}</dd>
              </div>
              <div className="flex justify-between gap-4 pb-2">
                <dt className="text-hive-slate">Status</dt>
                <dd>
                  <InvestmentStatusPill status={viewModalInv.status} />
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </>
  );
}
