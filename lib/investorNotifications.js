import dbConnect from "@/lib/dbConnect";
import Investor from "@/models/Investor";
import Investment from "@/models/Investment";
import InvestorNotification, { NOTIFICATION_TYPES } from "@/models/InvestorNotification";
import { isSmtpConfigured, sendMail } from "@/lib/mail";

function humanizeKebab(value, fallback = "") {
  const v = String(value || "").trim();
  if (!v) return fallback;
  return v
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
}

function formatPkr(amount) {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return "PKR 0";
  return `PKR ${Math.round(n).toLocaleString()}`;
}

function serializeNotification(row) {
  return {
    id: String(row._id),
    investorId: String(row.investorId),
    type: row.type,
    typeLabel: humanizeKebab(row.type, row.type),
    title: row.title,
    message: row.message,
    propertyId: row.propertyId ? String(row.propertyId) : null,
    investmentId: row.investmentId ? String(row.investmentId) : null,
    link: row.link || "",
    metadata: row.metadata ?? null,
    readAt: row.readAt || null,
    isRead: Boolean(row.readAt),
    createdAt: row.createdAt,
  };
}

async function maybeSendEmail(investorId, { subject, text }) {
  if (!isSmtpConfigured()) return;

  try {
    const investor = await Investor.findById(String(investorId)).select("email fullName").lean();
    if (!investor?.email) return;

    await sendMail({
      to: investor.email,
      subject,
      text: `Hello ${investor.fullName || "Investor"},\n\n${text}\n\n— Hive Construction`,
      html: `<p>Hello ${investor.fullName || "Investor"},</p><p>${text.replace(/\n/g, "<br/>")}</p><p>— Hive Construction</p>`,
    });
  } catch {
    // Email is best-effort; in-app notification is the source of truth.
  }
}

/**
 * @param {{
 *   investorId: string;
 *   type: string;
 *   title: string;
 *   message: string;
 *   propertyId?: string | null;
 *   investmentId?: string | null;
 *   link?: string;
 *   metadata?: object | null;
 *   sendEmail?: boolean;
 * }} opts
 */
export async function createInvestorNotification(opts) {
  const type = String(opts.type || "").trim();
  if (!NOTIFICATION_TYPES.includes(type)) {
    throw new Error(`Invalid notification type: ${type}`);
  }

  await dbConnect();

  const created = await InvestorNotification.create({
    investorId: String(opts.investorId),
    type,
    title: String(opts.title || "").trim(),
    message: String(opts.message || "").trim(),
    propertyId: opts.propertyId ? String(opts.propertyId) : null,
    investmentId: opts.investmentId ? String(opts.investmentId) : null,
    link: String(opts.link || "").trim(),
    metadata: opts.metadata ?? null,
  });

  if (opts.sendEmail) {
    await maybeSendEmail(opts.investorId, {
      subject: opts.title,
      text: opts.message,
    });
  }

  return serializeNotification(created.toObject());
}

export async function notifyInvestorsForProperty(propertyId, buildPayload) {
  await dbConnect();

  const rows = await Investment.find({ propertyId: String(propertyId) })
    .select("investorId")
    .lean();

  const investorIds = [...new Set(rows.map((row) => String(row.investorId)).filter(Boolean))];

  await Promise.all(
    investorIds.map(async (investorId) => {
      const payload = typeof buildPayload === "function" ? buildPayload(investorId) : buildPayload;
      if (!payload) return;
      try {
        await createInvestorNotification({ investorId, ...payload });
      } catch {
        // Non-blocking for admin flows.
      }
    })
  );
}

export async function notifyInvestmentCreated({
  investorId,
  propertyId,
  propertyTitle,
  amount,
  investmentId,
}) {
  try {
    await createInvestorNotification({
      investorId,
      type: "investment",
      title: "Investment recorded",
      message: `Your investment of ${formatPkr(amount)} in "${propertyTitle}" has been recorded. View details in My Investments.`,
      propertyId,
      investmentId,
      link: "/investor/investments",
      metadata: { amount: Number(amount || 0) },
      sendEmail: true,
    });
  } catch {
    // Non-blocking.
  }
}

export async function notifyProfitShare({
  investorId,
  propertyId,
  propertyTitle,
  amount,
  investmentId,
  distributedAt,
}) {
  const dateLabel = distributedAt
    ? new Date(distributedAt).toLocaleDateString("en-PK", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "recently";

  try {
    await createInvestorNotification({
      investorId,
      type: "profit-share",
      title: "Profit share distributed",
      message: `You received ${formatPkr(amount)} profit share for "${propertyTitle}" (${dateLabel}).`,
      propertyId,
      investmentId: investmentId || null,
      link: "/investor/investments",
      metadata: { amount: Number(amount || 0), distributedAt: distributedAt || null },
      sendEmail: true,
    });
  } catch {
    // Non-blocking.
  }
}

export async function notifyBulkProfitDistribution({
  propertyId,
  propertyTitle,
  allocations,
  distributedAt,
}) {
  const byInvestor = new Map();

  for (const row of allocations || []) {
    const investorId = String(row.investorId || "");
    if (!investorId) continue;

    const current = byInvestor.get(investorId) || { total: 0, investmentId: null };
    current.total += Number(row.amount || 0);
    current.investmentId = current.investmentId || row.investmentId;
    byInvestor.set(investorId, current);
  }

  await Promise.all(
    [...byInvestor.entries()].map(([investorId, summary]) =>
      notifyProfitShare({
        investorId,
        propertyId,
        propertyTitle,
        amount: summary.total,
        investmentId: summary.investmentId,
        distributedAt,
      })
    )
  );
}

export async function notifyPropertyStatusChange({
  propertyId,
  propertyTitle,
  field,
  previousValue,
  nextValue,
}) {
  const fieldLabel = field === "listingStatus" ? "Listing status" : "Construction status";
  const prevLabel = humanizeKebab(previousValue, "Unknown");
  const nextLabel = humanizeKebab(nextValue, "Updated");

  if (previousValue === nextValue) return;

  try {
    await notifyInvestorsForProperty(propertyId, {
      type: "property-status",
      title: `${propertyTitle} — status update`,
      message: `${fieldLabel} changed from ${prevLabel} to ${nextLabel}.`,
      propertyId,
      link: "/investor/investments",
      metadata: { field, previousValue, nextValue },
      sendEmail: true,
    });
  } catch {
    // Non-blocking.
  }
}

export async function notifySecurityCheque({
  investorId,
  propertyId,
  propertyTitle,
  investmentId,
  chequeNumber,
  status,
  principalAmount,
}) {
  const statusLabel = humanizeKebab(status, status);
  const title =
    status === "cleared"
      ? "Security cheque cleared"
      : status === "active"
        ? "Security cheque issued"
        : "Security cheque update";

  const message =
    status === "cleared"
      ? `Your security cheque (${chequeNumber}) for ${formatPkr(principalAmount)} on "${propertyTitle}" has been cleared.`
      : `A security cheque (${chequeNumber}) for ${formatPkr(principalAmount)} on "${propertyTitle}" is now ${statusLabel}.`;

  try {
    await createInvestorNotification({
      investorId,
      type: "security",
      title,
      message,
      propertyId,
      investmentId,
      link: "/investor/exit-plan",
      metadata: { chequeNumber, status, principalAmount: Number(principalAmount || 0) },
      sendEmail: status === "cleared" || status === "active",
    });
  } catch {
    // Non-blocking.
  }
}

export async function notifyExitRequestSubmitted({
  investorId,
  propertyId,
  propertyTitle,
  investmentId,
  requestTypeLabel,
}) {
  try {
    await createInvestorNotification({
      investorId,
      type: "exit",
      title: "Exit request submitted",
      message: `Your ${requestTypeLabel} request for "${propertyTitle}" was submitted and is pending admin review.`,
      propertyId,
      investmentId,
      link: "/investor/exit-plan",
      sendEmail: true,
    });
  } catch {
    // Non-blocking.
  }
}

export async function notifyExitRequestReviewed({
  investorId,
  propertyId,
  propertyTitle,
  investmentId,
  approved,
  adminNote,
}) {
  try {
    await createInvestorNotification({
      investorId,
      type: "exit",
      title: approved ? "Exit request approved" : "Exit request rejected",
      message: approved
        ? `Your exit request for "${propertyTitle}" was approved. A security cheque will be issued for settlement.${adminNote ? ` Note: ${adminNote}` : ""}`
        : `Your exit request for "${propertyTitle}" was rejected.${adminNote ? ` Reason: ${adminNote}` : ""}`,
      propertyId,
      investmentId,
      link: "/investor/exit-plan",
      sendEmail: true,
    });
  } catch {
    // Non-blocking.
  }
}

export async function notifyExitRequestCompleted({
  investorId,
  propertyId,
  propertyTitle,
  investmentId,
}) {
  try {
    await createInvestorNotification({
      investorId,
      type: "exit",
      title: "Exit completed",
      message: `Your exit from "${propertyTitle}" is complete. Your investment has been marked as withdrawn.`,
      propertyId,
      investmentId,
      link: "/investor/exit-plan",
      sendEmail: true,
    });
  } catch {
    // Non-blocking.
  }
}

export async function notifyAccountVerified({ investorId }) {
  try {
    await createInvestorNotification({
      investorId,
      type: "account",
      title: "Account verified",
      message:
        "Your investor account has been verified. You can now browse properties and record investments.",
      link: "/investor",
      sendEmail: true,
    });
  } catch {
    // Non-blocking.
  }
}

export { serializeNotification, humanizeKebab as humanizeNotificationType };
