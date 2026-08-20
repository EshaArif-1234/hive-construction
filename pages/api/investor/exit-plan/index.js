import dbConnect from "@/lib/dbConnect";
import { requireInvestor } from "@/lib/investorSession";
import Investment from "@/models/Investment";
import SecurityCheque from "@/models/SecurityCheque";
import {
  EXIT_PLAN_RULES,
  buildInvestmentExitPlan,
  summarizeExitPlan,
} from "@/lib/exitPlan";
import {
  populateSecurityCheque,
  serializeSecurityCheque,
} from "@/lib/serializeSecurityCheque";

export default async function handler(req, res) {
  const payload = requireInvestor(req, res);
  if (!payload) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await dbConnect();
    const investorId = String(payload.sub);

    const [investments, chequeRows] = await Promise.all([
      Investment.find({ investorId })
        .sort({ investmentDate: -1 })
        .select(
          "propertyId amount investmentDate status profitAmount sharePercentage paymentMethod"
        )
        .populate({
          path: "propertyId",
          select:
            "title city constructionStatus listingStatus expectedSellingPrice earlyWithdrawalAllowed earlyWithdrawalProfit investorProtectionEnabled totalCost",
          options: { lean: true },
        })
        .lean(),
      populateSecurityCheque(
        SecurityCheque.find({ investorId }).sort({ issueDate: -1, createdAt: -1 })
      ).lean(),
    ]);

    const cheques = chequeRows.map((row) => serializeSecurityCheque(row));
    const chequeByInvestmentId = new Map(cheques.map((c) => [c.investmentId, c]));

    const items = investments.map((inv) => {
      const investmentId = String(inv._id);
      const property = inv.propertyId && typeof inv.propertyId === "object" ? inv.propertyId : null;
      const cheque = chequeByInvestmentId.get(investmentId) || null;

      const investment = {
        id: investmentId,
        propertyId: property?._id ? String(property._id) : String(inv.propertyId || ""),
        amount: Number(inv.amount || 0),
        investmentDate: inv.investmentDate,
        status: inv.status || "active",
        profitAmount: Number(inv.profitAmount || 0),
        sharePercentage: Number(inv.sharePercentage || 0),
        paymentMethod: inv.paymentMethod,
      };

      const propertySummary = property
        ? {
            id: String(property._id),
            title: property.title,
            city: property.city,
            constructionStatus: property.constructionStatus,
            listingStatus: property.listingStatus,
            expectedSellingPrice: Number(property.expectedSellingPrice || 0),
            totalCost: Number(property.totalCost || 0),
            earlyWithdrawalAllowed: property.earlyWithdrawalAllowed !== false,
            earlyWithdrawalProfit: property.earlyWithdrawalProfit || "no-profit",
            investorProtectionEnabled: property.investorProtectionEnabled !== false,
          }
        : null;

      const exitPlan = buildInvestmentExitPlan({ investment, property: propertySummary, cheque });

      return {
        investment,
        property: propertySummary,
        cheque,
        exitPlan,
      };
    });

    const chequeSummary = {
      totalSecured: cheques.reduce((sum, c) => sum + (Number(c.principalAmount) || 0), 0),
      activeCount: cheques.filter((c) => c.status === "active" || c.status === "pending").length,
    };

    return res.status(200).json({
      rules: EXIT_PLAN_RULES,
      summary: {
        ...summarizeExitPlan(items),
        ...chequeSummary,
      },
      items,
      cheques,
    });
  } catch (err) {
    console.error("[api/investor/exit-plan]", err);
    return res.status(500).json({ message: "Server error" });
  }
}
