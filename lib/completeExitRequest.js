import ExitRequest from "@/models/ExitRequest";

export async function completeExitRequestForInvestment(investmentId, { securityChequeId } = {}) {
  const now = new Date();
  const filter = {
    investmentId: String(investmentId),
    status: "approved",
  };

  const update = {
    $set: {
      status: "completed",
      completedAt: now,
    },
  };

  if (securityChequeId) {
    update.$set.securityChequeId = String(securityChequeId);
  }

  const result = await ExitRequest.findOneAndUpdate(filter, update, { new: true }).lean();
  return result;
}
