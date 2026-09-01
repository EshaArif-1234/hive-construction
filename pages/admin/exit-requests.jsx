import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatExitRequestStatus, formatExitRequestType } from "@/lib/exitRequestConstants";

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

function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  const cls =
    s === "pending"
      ? "bg-amber-100 text-amber-900"
      : s === "approved"
        ? "bg-sky-100 text-sky-900"
        : s === "completed"
          ? "bg-emerald-100 text-emerald-900"
          : s === "rejected"
            ? "bg-red-100 text-red-900"
            : "bg-neutral-200 text-neutral-800";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {formatExitRequestStatus(status)}
    </span>
  );
}

export default function AdminExitRequestsPage() {
  const [exitRequests, setExitRequests] = useState([]);
  const [summary, setSummary] = useState({});
  const [statusFilter, setStatusFilter] = useState("pending");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviewRow, setReviewRow] = useState(null);
  const [reviewAction, setReviewAction] = useState("approve");
  const [adminNote, setAdminNote] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/exit-requests?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to load exit requests.");
        setExitRequests([]);
        return;
      }
      setExitRequests(Array.isArray(data?.exitRequests) ? data.exitRequests : []);
      setSummary(data?.summary || {});
    } catch {
      setError("Unable to load exit requests.");
      setExitRequests([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exitRequests.filter((x) => {
      if (!q) return true;
      const hay = `${x.investorName} ${x.investorEmail} ${x.propertyTitle} ${x.investmentId} ${x.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [exitRequests, query]);

  const openReview = (row, action) => {
    setReviewRow(row);
    setReviewAction(action);
    setAdminNote("");
    setChequeNumber("");
    setBankName("");
    setAccountHolder("");
    setPrincipalAmount(String(row?.requestedPayout?.principal || row?.investmentAmount || ""));
    setIssueDate(new Date().toISOString().slice(0, 10));
    setSubmitError("");
  };

  const onSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewRow?.id || submitting) return;

    setSubmitError("");
    setSubmitting(true);
    try {
      const body = {
        action: reviewAction,
        adminNote,
      };

      if (reviewAction === "approve") {
        body.cheque = {
          chequeNumber,
          bankName,
          accountHolder,
          principalAmount: Number(principalAmount),
          issueDate: issueDate ? new Date(issueDate).toISOString() : new Date().toISOString(),
          status: "active",
          settlementNote: adminNote,
        };
      }

      const res = await fetch(`/api/admin/exit-requests/${reviewRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data?.message || "Unable to process request.");
        return;
      }

      setReviewRow(null);
      await load();
    } catch {
      setSubmitError("Unable to process request.");
    } finally {
      setSubmitting(false);
    }
  };

  const onComplete = async (row) => {
    if (!row?.id) return;
    const ok = window.confirm("Mark this exit as completed and withdraw the investment?");
    if (!ok) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/exit-requests/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to complete exit.");
        return;
      }
      await load();
    } catch {
      setError("Unable to complete exit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Exit Requests | Hive Construction Admin</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Exit Requests</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
          Investor Exit Requests
        </h1>
        <p className="mt-2 text-sm leading-6 text-hive-slate">
          Review investor exit requests, approve with security cheque issuance, and complete exits across the system.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            ["Pending", summary.pendingCount ?? 0],
            ["Approved", summary.approvedCount ?? 0],
            ["Completed", summary.completedCount ?? 0],
            ["Rejected", summary.rejectedCount ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-hive-taupe/15 bg-white px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">{label}</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-hive-charcoal">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search investor, property, investment id"
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-slate">
            {loading ? "Loading…" : `${rows.length} shown`}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-hive-taupe/20">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-hive-charcoal">
                <tr>
                  {["Investor", "Property", "Type", "Requested payout", "Invested", "Submitted", "Status", "Actions"].map(
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
                      <p className="text-xs text-hive-slate">{x.investorEmail}</p>
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <p className="text-sm font-semibold">{x.propertyTitle}</p>
                      <p className="text-xs text-hive-slate">{x.propertyCity}</p>
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm">
                      {formatExitRequestType(x.requestType)}
                      {x.requestedPayout?.ruleNumber ? (
                        <p className="text-xs text-hive-slate">Rule {x.requestedPayout.ruleNumber}</p>
                      ) : null}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm font-semibold tabular-nums">
                      {formatPKR(x.requestedPayout?.total)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm">
                      {formatDate(x.investmentDate)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm">
                      {formatDate(x.createdAt)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <StatusPill status={x.status} />
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {x.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openReview(x, "approve")}
                              className="rounded-md bg-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-light"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => openReview(x, "reject")}
                              className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}
                        {x.status === "approved" ? (
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => onComplete(x)}
                            className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold disabled:opacity-60"
                          >
                            Complete exit
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-hive-slate">
                      No exit requests match your filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {reviewRow ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="my-auto w-full max-w-lg rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-hive-charcoal">
              {reviewAction === "approve" ? "Approve exit request" : "Reject exit request"}
            </h2>
            <p className="mt-1 text-sm text-hive-slate">
              {reviewRow.investorName} · {reviewRow.propertyTitle}
            </p>

            <form onSubmit={onSubmitReview} className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-semibold">Admin note</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              {reviewAction === "approve" ? (
                <>
                  <div>
                    <label className="text-sm font-semibold">Cheque number *</label>
                    <input
                      required
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                      className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold">Bank</label>
                      <input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold">Account holder</label>
                      <input
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold">Principal amount</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={principalAmount}
                        onChange={(e) => setPrincipalAmount(e.target.value)}
                        className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold">Issue date</label>
                      <input
                        type="date"
                        required
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </>
              ) : null}

              {submitError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</div>
              ) : null}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setReviewRow(null)} className="rounded-md border px-4 py-2 text-sm font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-hive-charcoal px-5 py-2 text-sm font-semibold text-hive-light disabled:opacity-60"
                >
                  {submitting ? "Saving…" : reviewAction === "approve" ? "Approve & issue cheque" : "Reject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
