import dbConnect from "@/lib/dbConnect";
import { requireInvestor } from "@/lib/investorSession";
import Investment from "@/models/Investment";
import SecurityCheque from "@/models/SecurityCheque";
import { loadInvestmentExitContext } from "@/lib/exitRequestContext";
import { EXIT_PLAN_RULES, summarizeExitPlan } from "@/lib/exitPlan";
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

  const { investmentId } = req.query;

  try {
    await dbConnect();
    const investorId = String(payload.sub);

    const investmentFilter = { investorId };
    if (investmentId && typeof investmentId === "string") {
      investmentFilter._id = String(investmentId);
    }

    const investments = await Investment.find(investmentFilter)
      .sort({ investmentDate: -1 })
      .select("_id")
      .lean();

    if (investmentId && investments.length === 0) {
      return res.status(404).json({ message: "Investment not found" });
    }

    const items = await Promise.all(
      investments.map(async (inv) => {
        const ctx = await loadInvestmentExitContext(String(inv._id), investorId);
        return {
          investment: ctx.investment,
          property: ctx.property,
          cheque: ctx.cheque,
          funding: ctx.funding,
          exitPlan: ctx.exitPlan,
          exitRequest: ctx.latestExitRequest,
          activeExitRequest: ctx.activeExitRequest,
        };
      })
    );

    const chequeRows = await populateSecurityCheque(
      SecurityCheque.find({ investorId }).sort({ issueDate: -1, createdAt: -1 })
    ).lean();

    const cheques = chequeRows.map((row) => serializeSecurityCheque(row));
    const chequeSummary = {
      totalSecured: cheques.reduce((sum, c) => sum + (Number(c.principalAmount) || 0), 0),
      activeCount: cheques.filter((c) => c.status === "active" || c.status === "pending").length,
    };

    const response = {
      rules: EXIT_PLAN_RULES,
      summary: {
        ...summarizeExitPlan(items),
        ...chequeSummary,
      },
      items,
      cheques,
    };

    if (investmentId && items.length === 1) {
      response.item = items[0];
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error("[api/investor/exit-plan]", err);
    return res.status(500).json({ message: "Server error" });
  }
}
