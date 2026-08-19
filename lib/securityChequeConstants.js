export const CHEQUE_STATUSES = [
  "pending",
  "active",
  "presented",
  "cleared",
  "cancelled",
  "bounced",
  "expired",
];

export const SETTLEMENT_TYPES = [
  "none",
  "early-withdrawal",
  "project-completion",
  "loss-scenario",
  "other",
];

export function formatChequeStatus(status) {
  const s = String(status || "").toLowerCase();
  const labels = {
    pending: "Pending",
    active: "Active",
    presented: "Presented",
    cleared: "Cleared",
    cancelled: "Cancelled",
    bounced: "Bounced",
    expired: "Expired",
  };
  return labels[s] || status || "—";
}

export function formatSettlementType(value) {
  const v = String(value || "").toLowerCase();
  const labels = {
    none: "None",
    "early-withdrawal": "Early withdrawal",
    "project-completion": "Project completion",
    "loss-scenario": "Loss scenario",
    other: "Other",
  };
  return labels[v] || value || "—";
}
