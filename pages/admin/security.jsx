import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CHEQUE_STATUSES,
  SETTLEMENT_TYPES,
  formatChequeStatus,
  formatSettlementType,
} from "@/lib/securityChequeConstants";

function formatPKR(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `PKR ${Math.round(x).toLocaleString("en-PK")}`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" });
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

function ChequeStatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  const cls =
    s === "active"
      ? "bg-emerald-100 text-emerald-900"
      : s === "pending"
        ? "bg-amber-100 text-amber-900"
        : s === "cleared"
          ? "bg-sky-100 text-sky-900"
          : s === "presented"
            ? "bg-violet-100 text-violet-900"
            : s === "cancelled" || s === "bounced" || s === "expired"
              ? "bg-red-100 text-red-900"
              : "bg-neutral-200 text-neutral-800";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {formatChequeStatus(status)}
    </span>
  );
}

export default function AdminSecurityPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");

  const [cheques, setCheques] = useState([]);
  const [summary, setSummary] = useState({
    totalPrincipalSecured: 0,
    activeCount: 0,
    clearedCount: 0,
  });
  const [investments, setInvestments] = useState([]);
  const [properties, setProperties] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [newInvestmentId, setNewInvestmentId] = useState("");
  const [newChequeNumber, setNewChequeNumber] = useState("");
  const [newBankName, setNewBankName] = useState("");
  const [newAccountHolder, setNewAccountHolder] = useState("");
  const [newPrincipalAmount, setNewPrincipalAmount] = useState("");
  const [newIssueDate, setNewIssueDate] = useState(todayInputValue());
  const [newMaturityDate, setNewMaturityDate] = useState("");
  const [newStatus, setNewStatus] = useState("pending");
  const [newNotes, setNewNotes] = useState("");

  const [viewCheque, setViewCheque] = useState(null);
  const [editCheque, setEditCheque] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({});
  const [deletingId, setDeletingId] = useState("");

  const loadCheques = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (propertyFilter !== "all") params.set("propertyId", propertyFilter);
      const qs = params.toString() ? `?${params.toString()}` : "";

      const res = await fetch(`/api/admin/security/cheques${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to load security cheques.");
        setCheques([]);
        return;
      }
      setCheques(Array.isArray(data?.cheques) ? data.cheques : []);
      setSummary(
        data?.summary || { totalPrincipalSecured: 0, activeCount: 0, clearedCount: 0 }
      );
    } catch {
      setError("Unable to load security cheques.");
      setCheques([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, propertyFilter]);

  const loadLookups = useCallback(async () => {
    try {
      const [invRes, propRes] = await Promise.all([
        fetch("/api/admin/investments"),
        fetch("/api/admin/properties"),
      ]);
      const invData = await invRes.json().catch(() => ({}));
      const propData = await propRes.json().catch(() => ({}));
      if (invRes.ok) {
        setInvestments(Array.isArray(invData?.investments) ? invData.investments : []);
      }
      if (propRes.ok) {
        setProperties(Array.isArray(propData?.properties) ? propData.properties : []);
      }
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    loadCheques();
  }, [loadCheques]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  const selectedInvestment = useMemo(
    () => investments.find((x) => x.id === newInvestmentId) || null,
    [investments, newInvestmentId]
  );

  useEffect(() => {
    if (selectedInvestment && !newPrincipalAmount) {
      setNewPrincipalAmount(String(selectedInvestment.amount || ""));
    }
  }, [selectedInvestment, newPrincipalAmount]);

  const openAddModal = () => {
    setAddError("");
    setNewInvestmentId("");
    setNewChequeNumber("");
    setNewBankName("");
    setNewAccountHolder("");
    setNewPrincipalAmount("");
    setNewIssueDate(todayInputValue());
    setNewMaturityDate("");
    setNewStatus("pending");
    setNewNotes("");
    setShowAddModal(true);
    loadLookups();
  };

  const onAddSubmit = async (e) => {
    e.preventDefault();
    if (addSubmitting) return;
    if (!newInvestmentId || !newChequeNumber.trim()) {
      setAddError("Select an investment and enter a cheque number.");
      return;
    }

    setAddError("");
    setAddSubmitting(true);
    try {
      const body = {
        investmentId: newInvestmentId,
        chequeNumber: newChequeNumber.trim(),
        bankName: newBankName,
        accountHolder: newAccountHolder,
        issueDate: new Date(newIssueDate).toISOString(),
        status: newStatus,
        notes: newNotes,
      };
      if (newPrincipalAmount) body.principalAmount = Number(newPrincipalAmount);
      if (newMaturityDate) body.maturityDate = new Date(newMaturityDate).toISOString();

      const res = await fetch("/api/admin/security/cheques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(data?.message || "Unable to record cheque.");
        return;
      }
      await loadCheques();
      setShowAddModal(false);
    } catch {
      setAddError("Unable to record cheque.");
    } finally {
      setAddSubmitting(false);
    }
  };

  const openEditModal = (row) => {
    setEditError("");
    setEditCheque(row);
    setEditForm({
      chequeNumber: row.chequeNumber || "",
      bankName: row.bankName || "",
      accountHolder: row.accountHolder || "",
      principalAmount: row.principalAmount != null ? String(row.principalAmount) : "",
      issueDate: toDateInputValue(row.issueDate),
      maturityDate: toDateInputValue(row.maturityDate),
      status: row.status || "pending",
      settlementType: row.settlementType || "none",
      settledAt: toDateInputValue(row.settledAt),
      settlementNote: row.settlementNote || "",
      notes: row.notes || "",
    });
  };

  const onEditSubmit = async (e) => {
    e.preventDefault();
    if (!editCheque?.id || editSubmitting) return;

    setEditError("");
    setEditSubmitting(true);
    try {
      const body = {
        chequeNumber: editForm.chequeNumber,
        bankName: editForm.bankName,
        accountHolder: editForm.accountHolder,
        principalAmount: Number(editForm.principalAmount),
        issueDate: editForm.issueDate ? new Date(editForm.issueDate).toISOString() : undefined,
        maturityDate: editForm.maturityDate
          ? new Date(editForm.maturityDate).toISOString()
          : null,
        status: editForm.status,
        settlementType: editForm.settlementType,
        settledAt: editForm.settledAt ? new Date(editForm.settledAt).toISOString() : null,
        settlementNote: editForm.settlementNote,
        notes: editForm.notes,
      };

      const res = await fetch(`/api/admin/security/cheques/${editCheque.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(data?.message || "Unable to update cheque.");
        return;
      }
      if (data?.cheque) {
        setCheques((prev) => prev.map((x) => (x.id === data.cheque.id ? data.cheque : x)));
      } else {
        await loadCheques();
      }
      setEditCheque(null);
    } catch {
      setEditError("Unable to update cheque.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const onDelete = async (row) => {
    const id = String(row?.id || "");
    if (!id) return;
    const ok = window.confirm(
      `Delete security cheque #${row.chequeNumber} for ${row.investorName}?`
    );
    if (!ok) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/security/cheques/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to delete cheque.");
        return;
      }
      await loadCheques();
    } catch {
      setError("Unable to delete cheque.");
    } finally {
      setDeletingId("");
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cheques.filter((x) => {
      if (!q) return true;
      const hay = `${x.id} ${x.chequeNumber} ${x.investorName} ${x.investorEmail} ${x.propertyTitle} ${x.investmentId}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, cheques]);

  const activeInvestments = useMemo(
    () => investments.filter((x) => x.status === "active" || x.status === "completed"),
    [investments]
  );

  return (
    <>
      <Head>
        <title>Admin Security & Exit Plan | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Investment Security
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
              Security Cheques
            </h1>
            <p className="mt-2 text-sm leading-6 text-hive-slate">
              Record and manage cheques issued to investors as principal security for each investment.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
          >
            Add security cheque
          </button>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-hive-taupe/15 bg-neutral-50 p-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">
              Principal secured (listed)
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-hive-charcoal">
              {formatPKR(summary.totalPrincipalSecured)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">
              Active / pending
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-800">{summary.activeCount}</p>
          </div>
          <div className="rounded-xl bg-hive-charcoal px-4 py-3 text-hive-light">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-taupe">Exit plan</p>
            <p className="mt-1 text-xs leading-relaxed text-white/85">
              Early withdrawal: principal only. Cleared cheques can mark investments withdrawn or completed.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-hive-taupe/20 bg-hive-light p-5">
          <h2 className="text-sm font-semibold text-hive-charcoal">Exit plan rules (reference)</h2>
          <ul className="mt-2 grid gap-1 text-xs leading-relaxed text-hive-slate sm:grid-cols-2">
            <li>• Sold before 1 year → 75% investors / 25% Hive profit split</li>
            <li>• Not sold within 1 year → principal + profit at market value</li>
            <li>• Early withdrawal → principal only (no profit)</li>
            <li>• Loss scenario → investor receives full principal; Hive bears loss</li>
          </ul>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm outline-none focus:border-hive-taupe sm:col-span-2"
            placeholder="Search cheque #, investor, property, investment ID"
          />
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm outline-none focus:border-hive-taupe"
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
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm outline-none focus:border-hive-taupe"
          >
            <option value="all">All statuses</option>
            {CHEQUE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatChequeStatus(s)}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 text-sm text-hive-slate">
          {loading ? "Loading…" : (
            <>
              Showing <span className="font-semibold text-hive-charcoal">{rows.length}</span> cheque(s)
            </>
          )}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-hive-taupe/20">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-hive-charcoal">
                <tr>
                  {["Cheque", "Investor", "Property", "Principal", "Issue date", "Maturity", "Status", "Actions"].map(
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
                      <p className="text-sm font-semibold text-hive-charcoal">#{x.chequeNumber}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-hive-slate">{x.investmentId}</p>
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <p className="text-sm font-semibold text-hive-charcoal">{x.investorName}</p>
                      <p className="text-xs text-hive-slate">{x.investorEmail}</p>
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <p className="text-sm font-semibold text-hive-charcoal">{x.propertyTitle}</p>
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm font-semibold tabular-nums">
                      {formatPKR(x.principalAmount)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm text-hive-slate">
                      {formatDate(x.issueDate)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm text-hive-slate">
                      {formatDate(x.maturityDate)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <ChequeStatusPill status={x.status} />
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewCheque(x)}
                          className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-charcoal"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(x)}
                          className="rounded-md bg-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-light"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === x.id}
                          onClick={() => onDelete(x)}
                          className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-60"
                        >
                          {deletingId === x.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border-t border-hive-taupe/20 px-4 py-10 text-center text-sm text-hive-slate">
                      No security cheques recorded yet. Add a cheque linked to an investment.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add modal */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="my-auto w-full max-w-lg rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">New record</p>
                <h2 className="mt-2 text-xl font-semibold text-hive-charcoal">Add security cheque</h2>
              </div>
              <button type="button" onClick={() => !addSubmitting && setShowAddModal(false)} className="rounded-md border px-3 py-2 text-xs font-semibold">
                Close
              </button>
            </div>

            <form onSubmit={onAddSubmit} className="mt-6 grid gap-4">
              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Investment</label>
                <select
                  required
                  value={newInvestmentId}
                  onChange={(e) => {
                    setNewInvestmentId(e.target.value);
                    setNewPrincipalAmount("");
                  }}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                >
                  <option value="">Select investment</option>
                  {activeInvestments.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.investorName} — {inv.propertyTitle} — {formatPKR(inv.amount)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvestment ? (
                <div className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-3 text-xs text-hive-slate">
                  Principal to secure: <span className="font-semibold text-hive-charcoal">{formatPKR(selectedInvestment.amount)}</span>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Cheque number</label>
                  <input
                    required
                    value={newChequeNumber}
                    onChange={(e) => setNewChequeNumber(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                    placeholder="123456789"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Principal (PKR)</label>
                  <input
                    value={newPrincipalAmount}
                    onChange={(e) => setNewPrincipalAmount(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Bank name</label>
                  <input
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Account holder</label>
                  <input
                    value={newAccountHolder}
                    onChange={(e) => setNewAccountHolder(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Issue date</label>
                  <input
                    type="date"
                    required
                    value={newIssueDate}
                    onChange={(e) => setNewIssueDate(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Maturity date (optional)</label>
                  <input
                    type="date"
                    value={newMaturityDate}
                    onChange={(e) => setNewMaturityDate(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                >
                  {CHEQUE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {formatChequeStatus(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
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
                  {addSubmitting ? "Saving…" : "Record cheque"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Edit modal */}
      {editCheque ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="my-auto w-full max-w-lg rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Update cheque</p>
                <h2 className="mt-2 text-lg font-semibold text-hive-charcoal">#{editCheque.chequeNumber}</h2>
                <p className="text-sm text-hive-slate">{editCheque.investorName} · {editCheque.propertyTitle}</p>
              </div>
              <button type="button" onClick={() => !editSubmitting && setEditCheque(null)} className="rounded-md border px-3 py-2 text-xs font-semibold">
                Close
              </button>
            </div>

            <form onSubmit={onEditSubmit} className="mt-4 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Cheque number</label>
                  <input
                    required
                    value={editForm.chequeNumber}
                    onChange={(e) => setEditForm((f) => ({ ...f, chequeNumber: e.target.value }))}
                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Principal (PKR)</label>
                  <input
                    required
                    value={editForm.principalAmount}
                    onChange={(e) => setEditForm((f) => ({ ...f, principalAmount: e.target.value }))}
                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-hive-taupe"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                  >
                    {CHEQUE_STATUSES.map((s) => (
                      <option key={s} value={s}>{formatChequeStatus(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold">Settlement type</label>
                  <select
                    value={editForm.settlementType}
                    onChange={(e) => setEditForm((f) => ({ ...f, settlementType: e.target.value }))}
                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                  >
                    {SETTLEMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{formatSettlementType(t)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Issue date</label>
                  <input
                    type="date"
                    required
                    value={editForm.issueDate}
                    onChange={(e) => setEditForm((f) => ({ ...f, issueDate: e.target.value }))}
                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Maturity date</label>
                  <input
                    type="date"
                    value={editForm.maturityDate}
                    onChange={(e) => setEditForm((f) => ({ ...f, maturityDate: e.target.value }))}
                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Settled on</label>
                <input
                  type="date"
                  value={editForm.settledAt}
                  onChange={(e) => setEditForm((f) => ({ ...f, settledAt: e.target.value }))}
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Settlement note</label>
                <input
                  value={editForm.settlementNote}
                  onChange={(e) => setEditForm((f) => ({ ...f, settlementNote: e.target.value }))}
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              {editError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{editError}</div>
              ) : null}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditCheque(null)} className="rounded-md border px-4 py-2 text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={editSubmitting} className="rounded-md bg-hive-charcoal px-5 py-2 text-sm font-semibold text-hive-light disabled:opacity-60">
                  {editSubmitting ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* View modal */}
      {viewCheque ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="my-auto w-full max-w-lg rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-hive-charcoal">Cheque #{viewCheque.chequeNumber}</h2>
              <button type="button" onClick={() => setViewCheque(null)} className="rounded-md border px-3 py-2 text-xs font-semibold">
                Close
              </button>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              {[
                ["Investor", viewCheque.investorName],
                ["Property", viewCheque.propertyTitle],
                ["Investment ID", viewCheque.investmentId],
                ["Principal", formatPKR(viewCheque.principalAmount)],
                ["Bank", viewCheque.bankName || "—"],
                ["Account holder", viewCheque.accountHolder || "—"],
                ["Issue date", formatDate(viewCheque.issueDate)],
                ["Maturity", formatDate(viewCheque.maturityDate)],
                ["Settlement", formatSettlementType(viewCheque.settlementType)],
                ["Settled on", formatDate(viewCheque.settledAt)],
                ["Recorded by", viewCheque.recordedBy || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-hive-taupe/10 pb-2">
                  <dt className="text-hive-slate">{label}</dt>
                  <dd className="text-right font-medium text-hive-charcoal">{value}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 pb-2">
                <dt className="text-hive-slate">Status</dt>
                <dd><ChequeStatusPill status={viewCheque.status} /></dd>
              </div>
              {viewCheque.settlementNote ? (
                <div className="rounded-lg bg-neutral-50 p-3 text-xs text-hive-slate">
                  <span className="font-semibold">Settlement note:</span> {viewCheque.settlementNote}
                </div>
              ) : null}
              {viewCheque.notes ? (
                <div className="rounded-lg bg-neutral-50 p-3 text-xs text-hive-slate">
                  <span className="font-semibold">Notes:</span> {viewCheque.notes}
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      ) : null}
    </>
  );
}
