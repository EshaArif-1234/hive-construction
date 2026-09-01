import { formatExitRequestStatus, formatExitRequestType } from "@/lib/exitRequestConstants";

export function serializeExitRequest(doc) {
  if (!doc) return null;

  const investor = doc.investorId;
  const property = doc.propertyId;
  const investment = doc.investmentId;
  const cheque = doc.securityChequeId;

  return {
    id: String(doc._id),
    investmentId:
      investment && typeof investment === "object"
        ? String(investment._id || investment)
        : String(doc.investmentId || ""),
    investorId:
      investor && typeof investor === "object"
        ? String(investor._id || investor)
        : String(doc.investorId || ""),
    propertyId:
      property && typeof property === "object"
        ? String(property._id || property)
        : String(doc.propertyId || ""),
    investorName:
      investor && typeof investor === "object" && investor.fullName
        ? investor.fullName
        : "Investor",
    investorEmail:
      investor && typeof investor === "object" && investor.email ? investor.email : "",
    propertyTitle:
      property && typeof property === "object" && property.title
        ? property.title
        : "Property",
    propertyCity:
      property && typeof property === "object" && property.city ? property.city : "",
    investmentAmount:
      investment && typeof investment === "object"
        ? Number(investment.amount || 0)
        : 0,
    investmentDate:
      investment && typeof investment === "object" ? investment.investmentDate : null,
    investmentStatus:
      investment && typeof investment === "object" ? investment.status || "active" : "active",
    requestType: doc.requestType,
    requestTypeLabel: formatExitRequestType(doc.requestType),
    status: doc.status,
    statusLabel: formatExitRequestStatus(doc.status),
    reason: doc.reason || "",
    adminNote: doc.adminNote || "",
    requestedPayout: {
      principal: Number(doc.requestedPayout?.principal || 0),
      profit: Number(doc.requestedPayout?.profit || 0),
      total: Number(doc.requestedPayout?.total || 0),
      ruleNumber: doc.requestedPayout?.ruleNumber || "",
      ruleId: doc.requestedPayout?.ruleId || "",
    },
    exitPlanSnapshot: {
      scenarioKey: doc.exitPlanSnapshot?.scenarioKey || "",
      scenarioTitle: doc.exitPlanSnapshot?.scenarioTitle || "",
      investmentAgeDays: Number(doc.exitPlanSnapshot?.investmentAgeDays || 0),
      withinFirstYear: Boolean(doc.exitPlanSnapshot?.withinFirstYear),
    },
    securityChequeId:
      cheque && typeof cheque === "object"
        ? String(cheque._id || cheque)
        : doc.securityChequeId
          ? String(doc.securityChequeId)
          : null,
    chequeNumber:
      cheque && typeof cheque === "object" && cheque.chequeNumber ? cheque.chequeNumber : "",
    reviewedBy: doc.reviewedBy || "",
    reviewedAt: doc.reviewedAt || null,
    completedAt: doc.completedAt || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function populateExitRequest(query) {
  return query
    .populate("investorId", "fullName email")
    .populate("propertyId", "title city")
    .populate("investmentId", "amount status investmentDate")
    .populate("securityChequeId", "chequeNumber status settlementType");
}
