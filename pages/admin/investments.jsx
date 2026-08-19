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

function formatPaymentMethod(value) {
  const v = String(value || "").toLowerCase();
  if (v === "bank-transfer") return "Bank transfer";
  if (v === "easypaisa") return "Easypaisa";
  if (v === "jazzcash") return "JazzCash";
  return value || "—";
}

function toDateInputValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
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
  const [propertyFilter, setPropertyFilter] = useState("all");

  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState({ totalPrincipal: 0, totalProfit: 0, activeCount: 0 });
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
  const [newDistAmount, setNewDistAmount] = useState("");
  const [newDistDate, setNewDistDate] = useState(todayInputValue());
  const [newDistNote, setNewDistNote] = useState("");
  const [profitStatusInput, setProfitStatusInput] = useState("active");
  const [profitSubmitting, setProfitSubmitting] = useState(false);
  const [profitError, setProfitError] = useState("");

  const [viewModalInv, setViewModalInv] = useState(null);

  const [editModalInv, setEditModalInv] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editInvestmentDate, setEditInvestmentDate] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const [deletingId, setDeletingId] = useState("");

  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [distributePropertyId, setDistributePropertyId] = useState("");
  const [distributeProfit, setDistributeProfit] = useState("");
  const [distributeDate, setDistributeDate] = useState(todayInputValue());
  const [distributeNote, setDistributeNote] = useState("");
  const [distributeMarkCompleted, setDistributeMarkCompleted] = useState(true);
  const [distributePreview, setDistributePreview] = useState(null);
  const [distributePreviewLoading, setDistributePreviewLoading] = useState(false);
  const [distributeSubmitting, setDistributeSubmitting] = useState(false);
  const [distributeError, setDistributeError] = useState("");

  const loadInvestments = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (propertyFilter !== "all") params.set("propertyId", propertyFilter);
      const qs = params.toString() ? `?${params.toString()}` : "";

      const res = await fetch(`/api/admin/investments${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to load investments.");
        setInvestments([]);
        setSummary({ totalPrincipal: 0, totalProfit: 0, activeCount: 0 });
        return;
      }
      setInvestments(Array.isArray(data?.investments) ? data.investments : []);
      setSummary(
        data?.summary || { totalPrincipal: 0, totalProfit: 0, activeCount: 0 }
      );
    } catch {
      setError("Unable to load investments.");
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, propertyFilter]);

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
      // non-fatal
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

  const openDistributeModal = () => {
    setDistributeError("");
    setDistributePropertyId("");
    setDistributeProfit("");
    setDistributeDate(todayInputValue());
    setDistributeNote("");
    setDistributeMarkCompleted(true);
    setDistributePreview(null);
    setShowDistributeModal(true);
    loadLookups();
  };

  const fetchDistributePreview = async () => {
    if (!distributePropertyId || !distributeProfit) {
      setDistributePreview(null);
      return;
    }
    const profitNum = Number(distributeProfit);
    if (!Number.isFinite(profitNum) || profitNum <= 0) {
      setDistributePreview(null);
      return;
    }

    setDistributePreviewLoading(true);
    setDistributeError("");
    try {
      const res = await fetch("/api/admin/investments/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: distributePropertyId,
          totalProjectProfit: profitNum,
          dryRun: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDistributeError(data?.message || "Unable to preview distribution.");
        setDistributePreview(null);
        return;
      }
      setDistributePreview(data?.preview || null);
    } catch {
      setDistributeError("Unable to preview distribution.");
      setDistributePreview(null);
    } finally {
      setDistributePreviewLoading(false);
    }
  };

  useEffect(() => {
    if (!showDistributeModal) return;
    const timer = setTimeout(fetchDistributePreview, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distributePropertyId, distributeProfit, showDistributeModal]);

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
      await loadInvestments();
      setShowAddModal(false);
    } catch {
      setAddError("Unable to create investment.");
    } finally {
      setAddSubmitting(false);
    }
  };

  const onDistributeSubmit = async (e) => {
    e.preventDefault();
    if (distributeSubmitting) return;
    if (!distributePropertyId) {
      setDistributeError("Select a property.");
      return;
    }
    const profitNum = Number(distributeProfit);
    if (!Number.isFinite(profitNum) || profitNum <= 0) {
      setDistributeError("Enter a valid total project profit.");
      return;
    }

    setDistributeError("");
    setDistributeSubmitting(true);
    try {
      const res = await fetch("/api/admin/investments/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: distributePropertyId,
          totalProjectProfit: profitNum,
          distributedAt: distributeDate
            ? new Date(distributeDate).toISOString()
            : undefined,
          note: distributeNote,
          markCompleted: distributeMarkCompleted,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDistributeError(data?.message || "Unable to distribute profit.");
        return;
      }
      if (Array.isArray(data?.investments)) {
        setInvestments(data.investments);
      } else {
        await loadInvestments();
      }
      setShowDistributeModal(false);
    } catch {
      setDistributeError("Unable to distribute profit.");
    } finally {
      setDistributeSubmitting(false);
    }
  };

  const openProfitModal = (row) => {
    setProfitError("");
    setProfitModalInv(row);
    setNewDistAmount("");
    setNewDistDate(todayInputValue());
    setNewDistNote("");
    setProfitStatusInput(row?.status || "active");
  };

  const closeProfitModal = () => {
    if (profitSubmitting) return;
    setProfitModalInv(null);
  };

  const openEditModal = (row) => {
    setEditError("");
    setEditModalInv(row);
    setEditAmount(row?.amount != null ? String(row.amount) : "");
    setEditInvestmentDate(toDateInputValue(row?.investmentDate));
  };

  const closeEditModal = () => {
    if (editSubmitting) return;
    setEditModalInv(null);
  };

  const onEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModalInv?.id || editSubmitting) return;

    const amt = Number(editAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setEditError("Enter a valid amount.");
      return;
    }
    if (!editInvestmentDate) {
      setEditError("Investment date is required.");
      return;
    }

    setEditError("");
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/admin/investments/${editModalInv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          investmentDate: new Date(editInvestmentDate).toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(data?.message || "Unable to update investment.");
        return;
      }
      if (data?.investment) {
        setInvestments((prev) =>
          prev.map((x) => (x.id === data.investment.id ? data.investment : x))
        );
      } else {
        await loadInvestments();
      }
      setEditModalInv(null);
    } catch {
      setEditError("Unable to update investment.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const onDelete = async (row) => {
    const id = String(row?.id || "");
    if (!id) return;

    const ok = window.confirm(
      `Delete investment for ${row?.investorName || "investor"} on "${row?.propertyTitle || "property"}"?`
    );
    if (!ok) return;

    setError("");
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/investments/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to delete investment.");
        return;
      }
      await loadInvestments();
    } catch {
      setError("Unable to delete investment.");
    } finally {
      setDeletingId("");
    }
  };

  const onProfitSubmit = async (e) => {
    e.preventDefault();
    if (!profitModalInv?.id || profitSubmitting) return;

    const distAmount = Number(newDistAmount);
    const hasDistribution = Number.isFinite(distAmount) && distAmount > 0;

    setProfitError("");
    setProfitSubmitting(true);
    try {
      const body = { status: profitStatusInput };
      if (hasDistribution) {
        body.addProfitDistribution = {
          amount: distAmount,
          distributedAt: newDistDate
            ? new Date(newDistDate).toISOString()
            : new Date().toISOString(),
          note: newDistNote,
        };
      }

      const res = await fetch(`/api/admin/investments/${profitModalInv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
        if (hasDistribution) {
          setProfitModalInv(data.investment);
          setNewDistAmount("");
          setNewDistNote("");
        } else {
          setProfitModalInv(null);
        }
      } else {
        await loadInvestments();
        setProfitModalInv(null);
      }
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

  const propertiesWithInvestments = useMemo(() => {
    const ids = new Set(investments.map((x) => x.propertyId));
    return properties.filter((p) => ids.has(p.id));
  }, [investments, properties]);

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
              Manage Investments
            </h1>
            <p className="mt-2 text-sm leading-6 text-hive-slate">
              Track investor contributions, dates, and profit distributions. Pool share is calculated from
              amount ÷ investor funding pool.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openDistributeModal}
              className="inline-flex items-center justify-center rounded-md border border-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
            >
              Distribute profit
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
            >
              Add investment
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-hive-taupe/15 bg-neutral-50 p-4 sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">
              Total principal
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-hive-charcoal">
              {formatPKR(summary.totalPrincipal)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">
              Profit distributed
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-800">
              {formatPKR(summary.totalProfit)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">
              Active investments
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-hive-charcoal">{summary.activeCount}</p>
          </div>
          <div className="rounded-xl bg-hive-charcoal px-4 py-3 text-hive-light">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-taupe">Profit split</p>
            <p className="mt-1 text-xs leading-relaxed text-white/85">
              75% investors / 25% Hive — use bulk distribute or record per investor.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe sm:col-span-2"
            placeholder="Search investor, property, or ID"
          />

          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
          >
            <option value="all">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

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
                <span className="font-semibold text-hive-charcoal">{rows.length}</span> shown
              </>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-hive-taupe/20">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-hive-charcoal">
                <tr>
                  {["Investor", "Property", "Amount", "Pool share", "Profit", "Invested", "Last payout", "Status", "Actions"].map(
                    (label) => (
                      <th
                        key={label}
                        className={`px-4 py-3 text-xs font-semibold uppercase tracking-widest text-hive-taupe ${
                          label === "Actions" ? "text-right" : "text-left"
                        }`}
                      >
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((x) => (
                  <tr key={x.id} className="odd:bg-hive-light even:bg-white/80">
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
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm text-hive-slate">
                      {formatDate(x.lastProfitDistributedAt)}
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
                          onClick={() => openEditModal(x)}
                          className="rounded-md border border-hive-taupe/40 px-3 py-2 text-xs font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openProfitModal(x)}
                          className="rounded-md bg-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-light transition-colors hover:text-hive-taupe"
                        >
                          Profit
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === x.id}
                          onClick={() => onDelete(x)}
                          className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                        >
                          {deletingId === x.id ? "…" : "Delete"}
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

      {/* Add investment modal */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="my-auto w-full max-w-lg rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Manual entry</p>
                <h2 className="mt-2 text-xl font-semibold text-hive-charcoal">Add investment</h2>
              </div>
              <button
                type="button"
                onClick={() => !addSubmitting && setShowAddModal(false)}
                className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-charcoal"
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
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                >
                  <option value="">Select investor</option>
                  {investors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.fullName} ({i.email})
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
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                >
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — {p.city || "—"}
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
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded-md border px-4 py-2 text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={addSubmitting} className="rounded-md bg-hive-charcoal px-5 py-2 text-sm font-semibold text-hive-light disabled:opacity-60">
                  {addSubmitting ? "Saving…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Bulk distribute modal */}
      {showDistributeModal ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="my-auto w-full max-w-2xl rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Bulk action</p>
                <h2 className="mt-2 text-xl font-semibold text-hive-charcoal">Distribute property profit</h2>
                <p className="mt-1 text-sm text-hive-slate">
                  Splits total project profit using the property&apos;s investor/Hive ratio, then allocates the
                  investor portion by each stake in the funding pool.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !distributeSubmitting && setShowDistributeModal(false)}
                className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={onDistributeSubmit} className="mt-6 grid gap-4">
              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Property</label>
                <select
                  required
                  value={distributePropertyId}
                  onChange={(e) => setDistributePropertyId(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                >
                  <option value="">Select property</option>
                  {(propertiesWithInvestments.length ? propertiesWithInvestments : properties).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Total project profit (PKR)</label>
                  <input
                    value={distributeProfit}
                    onChange={(e) => setDistributeProfit(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                    inputMode="decimal"
                    placeholder="1000000"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Distribution date</label>
                  <input
                    type="date"
                    value={distributeDate}
                    onChange={(e) => setDistributeDate(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Note (optional)</label>
                <input
                  value={distributeNote}
                  onChange={(e) => setDistributeNote(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                  placeholder="e.g. Final sale profit — March 2026"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-hive-charcoal">
                <input
                  type="checkbox"
                  checked={distributeMarkCompleted}
                  onChange={(e) => setDistributeMarkCompleted(e.target.checked)}
                />
                Mark investments as completed after distribution
              </label>

              {distributePreviewLoading ? (
                <p className="text-sm text-hive-slate">Calculating preview…</p>
              ) : distributePreview ? (
                <div className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4 text-sm">
                  <p className="text-xs text-hive-slate">
                    Total project profit:{" "}
                    <span className="font-semibold text-hive-charcoal">
                      {formatPKR(distributePreview.totalProjectProfit)}
                    </span>
                    {" · "}
                    Split {distributePreview.investorProfitSharePct}% investors /{" "}
                    {distributePreview.hiveProfitSharePct}% Hive
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-hive-slate/70">Investor pool</p>
                      <p className="font-bold text-emerald-800">{formatPKR(distributePreview.investorPoolProfit)}</p>
                      <p className="text-xs text-hive-slate">{distributePreview.investorProfitSharePct}% of profit</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-hive-slate/70">Hive share</p>
                      <p className="font-bold text-hive-charcoal">{formatPKR(distributePreview.hiveProfit)}</p>
                      <p className="text-xs text-hive-slate">{distributePreview.hiveProfitSharePct}% of profit</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-hive-slate/70">Investors</p>
                      <p className="font-bold text-hive-charcoal">{distributePreview.allocations?.length || 0}</p>
                    </div>
                  </div>
                  {Array.isArray(distributePreview.allocations) && distributePreview.allocations.length > 0 ? (
                    <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs text-hive-slate">
                      {distributePreview.allocations.map((row) => (
                        <li key={row.investmentId} className="flex justify-between gap-3">
                          <span>Stake {formatPKR(row.stakeAmount)} ({formatPct(row.poolSharePct)})</span>
                          <span className="font-semibold text-hive-charcoal">{formatPKR(row.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {distributeError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{distributeError}</div>
              ) : null}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowDistributeModal(false)} className="rounded-md border px-4 py-2 text-sm font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={distributeSubmitting || !distributePreview?.allocations?.length}
                  className="rounded-md bg-hive-charcoal px-5 py-2 text-sm font-semibold text-hive-light disabled:opacity-60"
                >
                  {distributeSubmitting ? "Distributing…" : "Confirm distribution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Profit modal */}
      {profitModalInv ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="my-auto w-full max-w-lg rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Profit distribution</p>
                <h2 className="mt-2 text-lg font-semibold text-hive-charcoal">{profitModalInv.investorName}</h2>
                <p className="text-sm text-hive-slate">{profitModalInv.propertyTitle}</p>
              </div>
              <button type="button" onClick={closeProfitModal} className="rounded-md border px-3 py-2 text-xs font-semibold">
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-hive-taupe/15 bg-neutral-50 p-3 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase text-hive-slate/70">Principal</p>
                <p className="font-bold">{formatPKR(profitModalInv.amount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-hive-slate/70">Total profit</p>
                <p className="font-bold text-emerald-800">{formatPKR(profitModalInv.profitAmount)}</p>
              </div>
            </div>

            {Array.isArray(profitModalInv.profitDistributions) && profitModalInv.profitDistributions.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-hive-slate/70">History</p>
                <ul className="mt-2 max-h-36 space-y-2 overflow-y-auto">
                  {[...profitModalInv.profitDistributions]
                    .sort((a, b) => new Date(b.distributedAt) - new Date(a.distributedAt))
                    .map((row) => (
                      <li
                        key={row.id || `${row.distributedAt}-${row.amount}`}
                        className="rounded-lg border border-hive-taupe/15 px-3 py-2 text-xs"
                      >
                        <div className="flex justify-between gap-3">
                          <span className="font-semibold text-emerald-800">{formatPKR(row.amount)}</span>
                          <span className="text-hive-slate">{formatDate(row.distributedAt)}</span>
                        </div>
                        {row.note ? <p className="mt-1 text-hive-slate">{row.note}</p> : null}
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <p className="mt-4 text-xs text-hive-slate">No profit distributions recorded yet.</p>
            )}

            <form onSubmit={onProfitSubmit} className="mt-4 grid gap-4 border-t border-hive-taupe/15 pt-4">
              <p className="text-sm font-semibold text-hive-charcoal">Add payout</p>
              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Amount (PKR)</label>
                <input
                  value={newDistAmount}
                  onChange={(e) => setNewDistAmount(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                  inputMode="decimal"
                  placeholder="Leave empty to update status only"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Payout date</label>
                <input
                  type="date"
                  value={newDistDate}
                  onChange={(e) => setNewDistDate(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Note</label>
                <input
                  value={newDistNote}
                  onChange={(e) => setNewDistNote(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                  placeholder="Optional"
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
                <button type="button" onClick={closeProfitModal} className="rounded-md border px-4 py-2 text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={profitSubmitting} className="rounded-md bg-hive-charcoal px-5 py-2 text-sm font-semibold text-hive-light disabled:opacity-60">
                  {profitSubmitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* View modal */}
      {viewModalInv ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="my-auto w-full max-w-lg rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-hive-charcoal">Investment details</h2>
              <button type="button" onClick={() => setViewModalInv(null)} className="rounded-md border px-3 py-2 text-xs font-semibold">
                Close
              </button>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              {[
                ["ID", viewModalInv.id, "font-mono text-xs"],
                ["Investor", viewModalInv.investorName, "font-semibold"],
                ["Email", viewModalInv.investorEmail || "—", ""],
                ["Property", viewModalInv.propertyTitle, "font-semibold"],
                ["Amount", formatPKR(viewModalInv.amount), "font-semibold tabular-nums"],
                ["Pool share", formatPct(viewModalInv.sharePercentage), "tabular-nums"],
                ["Profit split", `${viewModalInv.propertyInvestorProfitShare ?? 75}% / ${viewModalInv.propertyHiveProfitShare ?? 25}%`, ""],
                ["Profit recorded", formatPKR(viewModalInv.profitAmount), "font-semibold text-emerald-800 tabular-nums"],
                ["Last payout", formatDate(viewModalInv.lastProfitDistributedAt), ""],
                ["Payment", formatPaymentMethod(viewModalInv.paymentMethod), ""],
                ["Invested on", formatDate(viewModalInv.investmentDate), ""],
              ].map(([label, value, extra]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-hive-taupe/10 pb-2">
                  <dt className="text-hive-slate">{label}</dt>
                  <dd className={`text-right text-hive-charcoal ${extra}`}>{value}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 pb-2">
                <dt className="text-hive-slate">Status</dt>
                <dd>
                  <InvestmentStatusPill status={viewModalInv.status} />
                </dd>
              </div>
            </dl>

            {Array.isArray(viewModalInv.profitDistributions) && viewModalInv.profitDistributions.length > 0 ? (
              <div className="mt-4 border-t border-hive-taupe/15 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-hive-slate/70">Profit history</p>
                <ul className="mt-2 space-y-2">
                  {viewModalInv.profitDistributions.map((row) => (
                    <li key={row.id || row.distributedAt} className="rounded-lg bg-neutral-50 px-3 py-2 text-xs">
                      <div className="flex justify-between">
                        <span className="font-semibold text-emerald-800">{formatPKR(row.amount)}</span>
                        <span>{formatDate(row.distributedAt)}</span>
                      </div>
                      {row.note ? <p className="mt-1 text-hive-slate">{row.note}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Edit modal */}
      {editModalInv ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="my-auto w-full max-w-md rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Edit investment</p>
                <h2 className="mt-2 text-lg font-semibold text-hive-charcoal">Amount & date</h2>
                <p className="mt-1 text-xs text-hive-slate">Pool share recalculates automatically.</p>
              </div>
              <button type="button" onClick={closeEditModal} className="rounded-md border px-3 py-2 text-xs font-semibold">
                Close
              </button>
            </div>

            <form onSubmit={onEditSubmit} className="mt-4 grid gap-4">
              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Amount (PKR)</label>
                <input
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Investment date</label>
                <input
                  type="date"
                  value={editInvestmentDate}
                  onChange={(e) => setEditInvestmentDate(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                  required
                />
              </div>
              {editError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{editError}</div>
              ) : null}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeEditModal} className="rounded-md border px-4 py-2 text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={editSubmitting} className="rounded-md bg-hive-charcoal px-5 py-2 text-sm font-semibold text-hive-light disabled:opacity-60">
                  {editSubmitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
