export function serializeSecurityCheque(doc) {
  if (!doc) return null;

  const inv = doc.investorId;
  const prop = doc.propertyId;
  const investment = doc.investmentId;

  const investorName =
    inv && typeof inv === "object" && inv.fullName ? inv.fullName : "Unknown investor";
  const investorEmail = inv && typeof inv === "object" && inv.email ? inv.email : "";

  const propertyTitle =
    prop && typeof prop === "object" && prop.title ? prop.title : "Unknown property";
  const propertyLocation =
    prop && typeof prop === "object" && prop.city ? prop.city : "";

  const investmentAmount =
    investment && typeof investment === "object"
      ? Number(investment.amount || 0)
      : 0;

  return {
    id: String(doc._id),
    investmentId:
      doc.investmentId && typeof doc.investmentId === "object"
        ? String(doc.investmentId._id || doc.investmentId)
        : String(doc.investmentId || ""),
    investmentAmount,
    investorId:
      doc.investorId && typeof doc.investorId === "object"
        ? String(doc.investorId._id || doc.investorId)
        : String(doc.investorId || ""),
    investorName,
    investorEmail,
    propertyId:
      doc.propertyId && typeof doc.propertyId === "object"
        ? String(doc.propertyId._id || doc.propertyId)
        : String(doc.propertyId || ""),
    propertyTitle,
    propertyLocation,
    chequeNumber: doc.chequeNumber,
    bankName: doc.bankName || "",
    accountHolder: doc.accountHolder || "",
    principalAmount: Number(doc.principalAmount || 0),
    currency: doc.currency || "PKR",
    issueDate: doc.issueDate,
    maturityDate: doc.maturityDate || null,
    status: doc.status,
    settlementType: doc.settlementType || "none",
    settledAt: doc.settledAt || null,
    settlementNote: doc.settlementNote || "",
    notes: doc.notes || "",
    recordedBy: doc.recordedBy || "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function populateSecurityCheque(query) {
  return query
    .populate("investorId", "fullName email")
    .populate("propertyId", "title city")
    .populate("investmentId", "amount status investmentDate");
}
