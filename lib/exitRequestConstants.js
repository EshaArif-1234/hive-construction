export const EXIT_REQUEST_STATUSES = ["pending", "approved", "rejected", "completed", "cancelled"];

export const EXIT_REQUEST_TYPES = ["early-withdrawal", "not-sold-after-year"];

export function formatExitRequestStatus(status) {
  const s = String(status || "").toLowerCase();
  const labels = {
    pending: "Pending review",
    approved: "Approved — cheque issued",
    rejected: "Rejected",
    completed: "Exit completed",
    cancelled: "Cancelled",
  };
  return labels[s] || status || "—";
}

export function formatExitRequestType(value) {
  const v = String(value || "").toLowerCase();
  if (v === "early-withdrawal") return "Early withdrawal (Rule III)";
  if (v === "not-sold-after-year") return "Market-value exit (Rule II)";
  return value || "—";
}

export function settlementTypeForExitRequest(requestType) {
  const t = String(requestType || "").toLowerCase();
  if (t === "early-withdrawal") return "early-withdrawal";
  return "other";
}
