import mongoose from "mongoose";
import Investor from "@/models/Investor";
import Investment from "@/models/Investment";
import Property from "@/models/Property";
import SecurityCheque from "@/models/SecurityCheque";
import PropertyProfitDistribution from "@/models/PropertyProfitDistribution";
import { getPropertyFundingStats } from "@/lib/propertyFunding";
import {
  computeHivePoolProfit,
  computeInvestorPoolProfit,
  splitProjectProfit,
  validatePropertyProfitShare,
} from "@/lib/profitDistribution";

function toObjectId(id) {
  try {
    return new mongoose.Types.ObjectId(String(id));
  } catch {
    return null;
  }
}

function humanizeListingStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return "Active";
  if (s === "paused") return "Paused";
  if (s === "completed") return "Completed";
  if (s === "archived") return "Archived";
  return "Draft";
}

function humanizeConstructionStatus(status) {
  const s = String(status || "").toLowerCase();
  return s
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
}

export async function buildReportsOverview() {
  const [
    investorCount,
    verifiedInvestorCount,
    propertyCount,
    investmentAgg,
    profitAgg,
    chequeAgg,
    activeInvestments,
    hiveProfitAgg,
  ] = await Promise.all([
    Investor.countDocuments(),
    Investor.countDocuments({ status: "verified" }),
    Property.countDocuments(),
    Investment.aggregate([
      {
        $group: {
          _id: null,
          totalPrincipal: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Investment.aggregate([
      {
        $group: {
          _id: null,
          totalProfit: { $sum: "$profitAmount" },
        },
      },
    ]),
    SecurityCheque.aggregate([
      {
        $group: {
          _id: null,
          totalSecured: { $sum: "$principalAmount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Investment.countDocuments({ status: "active" }),
    PropertyProfitDistribution.aggregate([
      { $group: { _id: null, totalHive: { $sum: "$hiveAmount" }, events: { $sum: 1 } } },
    ]),
  ]);

  return {
    investors: {
      total: investorCount,
      verified: verifiedInvestorCount,
      pending: investorCount - verifiedInvestorCount,
    },
    properties: { total: propertyCount },
    investments: {
      total: investmentAgg[0]?.count ?? 0,
      active: activeInvestments,
      totalPrincipal: Number(investmentAgg[0]?.totalPrincipal ?? 0),
    },
    profit: {
      totalDistributed: Number(profitAgg[0]?.totalProfit ?? 0),
      totalHiveRecorded: Number(hiveProfitAgg[0]?.totalHive ?? 0),
      distributionEvents: hiveProfitAgg[0]?.events ?? 0,
    },
    security: {
      chequesRecorded: chequeAgg[0]?.count ?? 0,
      principalSecured: Number(chequeAgg[0]?.totalSecured ?? 0),
    },
  };
}

export async function buildInvestorActivityReport({ status, from, to } = {}) {
  const investorFilter = {};
  if (status && ["pending", "verified"].includes(String(status))) {
    investorFilter.status = String(status);
  }

  const investors = await Investor.find(investorFilter)
    .sort({ createdAt: -1 })
    .select("fullName email phone status createdAt")
    .lean();

  const dateFilter = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) dateFilter.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      dateFilter.$lte = d;
    }
  }

  const investmentMatch = {};
  if (Object.keys(dateFilter).length > 0) {
    investmentMatch.investmentDate = dateFilter;
  }

  const rows = await Promise.all(
    investors.map(async (inv) => {
      const invId = inv._id;
      const match = { investorId: invId, ...investmentMatch };

      const [invAgg, chequeCount, investments] = await Promise.all([
        Investment.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              totalInvested: { $sum: "$amount" },
              totalProfit: { $sum: "$profitAmount" },
              count: { $sum: 1 },
              activeCount: {
                $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
              },
            },
          },
        ]),
        SecurityCheque.countDocuments({ investorId: invId }),
        Investment.find(match)
          .sort({ investmentDate: -1 })
          .select("propertyId amount profitAmount status investmentDate")
          .populate("propertyId", "title city")
          .limit(5)
          .lean(),
      ]);

      const stats = invAgg[0] || {
        totalInvested: 0,
        totalProfit: 0,
        count: 0,
        activeCount: 0,
      };

      return {
        id: String(inv._id),
        fullName: inv.fullName,
        email: inv.email,
        phone: inv.phone || "",
        status: inv.status,
        joinedAt: inv.createdAt,
        investmentCount: stats.count,
        activeInvestments: stats.activeCount,
        totalInvested: Number(stats.totalInvested || 0),
        totalProfit: Number(stats.totalProfit || 0),
        chequesCount: chequeCount,
        recentInvestments: investments.map((x) => ({
          id: String(x._id),
          propertyTitle: x.propertyId?.title || "Property",
          propertyCity: x.propertyId?.city || "",
          amount: Number(x.amount || 0),
          profitAmount: Number(x.profitAmount || 0),
          status: x.status,
          investmentDate: x.investmentDate,
        })),
      };
    })
  );

  const summary = rows.reduce(
    (acc, row) => {
      acc.totalInvestors += 1;
      acc.totalInvested += row.totalInvested;
      acc.totalProfit += row.totalProfit;
      acc.totalInvestments += row.investmentCount;
      return acc;
    },
    { totalInvestors: 0, totalInvested: 0, totalProfit: 0, totalInvestments: 0 }
  );

  return { summary, investors: rows };
}

export async function buildPropertyStatusReport({ listingStatus } = {}) {
  const filter = {};
  if (listingStatus && listingStatus !== "all") {
    filter.listingStatus = String(listingStatus);
  }

  const properties = await Property.find(filter)
    .sort({ createdAt: -1 })
    .select(
      "title city listingStatus constructionStatus totalCost investorFundingRequired fundingCollected fundingProgressPct expectedSellingPrice investorProfitShare hiveProfitShare"
    )
    .lean();

  const rows = await Promise.all(
    properties.map(async (p) => {
      const stats = await getPropertyFundingStats(p._id, {
        totalCost: p.totalCost,
        investorFundingRequired: p.investorFundingRequired,
      });

      const [profitAgg, investmentCount] = await Promise.all([
        Investment.aggregate([
          { $match: { propertyId: p._id } },
          {
            $group: {
              _id: null,
              totalProfit: { $sum: "$profitAmount" },
              totalPrincipal: { $sum: "$amount" },
            },
          },
        ]),
        Investment.countDocuments({ propertyId: p._id }),
      ]);

      const profitStats = profitAgg[0] || { totalProfit: 0, totalPrincipal: 0 };
      const totalCost = Number(p.totalCost || 0);
      const expectedSale = Number(p.expectedSellingPrice || 0);
      const projectedProfit = expectedSale > totalCost ? expectedSale - totalCost : 0;

      return {
        id: String(p._id),
        title: p.title,
        city: p.city || "",
        listingStatus: p.listingStatus,
        listingStatusLabel: humanizeListingStatus(p.listingStatus),
        constructionStatus: p.constructionStatus,
        constructionStatusLabel: humanizeConstructionStatus(p.constructionStatus),
        totalCost,
        investorFundingRequired: Number(p.investorFundingRequired || 0),
        fundingCollected: stats.fundingCollected,
        fundingProgressPct: stats.fundingProgressPct,
        remainingFunding: stats.remainingFunding,
        investorCount: stats.investorCount,
        isFullyFunded: stats.isFullyFunded,
        expectedSellingPrice: expectedSale,
        projectedProfit,
        profitDistributed: Number(profitStats.totalProfit || 0),
        totalInvested: Number(profitStats.totalPrincipal || 0),
        investmentCount,
        investorProfitShare: Number(p.investorProfitShare ?? 75),
        hiveProfitShare: Number(p.hiveProfitShare ?? 25),
      };
    })
  );

  const summary = rows.reduce(
    (acc, row) => {
      acc.totalProperties += 1;
      acc.totalCost += row.totalCost;
      acc.totalRaised += row.fundingCollected;
      acc.totalProfitDistributed += row.profitDistributed;
      if (row.isFullyFunded) acc.fullyFundedCount += 1;
      if (row.listingStatus === "active") acc.activeListings += 1;
      return acc;
    },
    {
      totalProperties: 0,
      totalCost: 0,
      totalRaised: 0,
      totalProfitDistributed: 0,
      fullyFundedCount: 0,
      activeListings: 0,
    }
  );

  return { summary, properties: rows };
}

export async function buildProfitLossReport({ propertyId } = {}) {
  const propertyFilter = {};
  if (propertyId) {
    const oid = toObjectId(propertyId);
    if (oid) propertyFilter._id = oid;
  }

  const properties = await Property.find(propertyFilter)
    .select(
      "title city totalCost expectedSellingPrice investorProfitShare hiveProfitShare listingStatus constructionStatus"
    )
    .lean();

  const rows = await Promise.all(
    properties.map(async (p) => {
      const totalCost = Number(p.totalCost || 0);
      const expectedSale = Number(p.expectedSellingPrice || 0);

      const [invAgg, profitByStatus] = await Promise.all([
        Investment.aggregate([
          { $match: { propertyId: p._id } },
          {
            $group: {
              _id: null,
              totalPrincipal: { $sum: "$amount" },
              investorProfitPaid: { $sum: "$profitAmount" },
              count: { $sum: 1 },
            },
          },
        ]),
        Investment.aggregate([
          { $match: { propertyId: p._id } },
          { $group: { _id: "$status", total: { $sum: "$profitAmount" } } },
        ]),
      ]);

      const inv = invAgg[0] || { totalPrincipal: 0, investorProfitPaid: 0, count: 0 };
      const investorProfitPaid = Number(inv.investorProfitPaid || 0);

      const grossProjectProfit = expectedSale > 0 ? expectedSale - totalCost : null;
      const projectedInvestorShare =
        grossProjectProfit != null && grossProjectProfit > 0
          ? computeInvestorPoolProfit(grossProjectProfit, Number(p.investorProfitShare ?? 75))
          : 0;
      const projectedHiveShare =
        grossProjectProfit != null && grossProjectProfit > 0
          ? computeHivePoolProfit(grossProjectProfit, Number(p.hiveProfitShare ?? 25))
          : 0;

      const unrealizedInvestorProfit = Math.max(0, projectedInvestorShare - investorProfitPaid);

      const profitByStatusMap = {};
      for (const row of profitByStatus) {
        profitByStatusMap[row._id || "unknown"] = Number(row.total || 0);
      }

      const isLossScenario = expectedSale > 0 && expectedSale < totalCost;
      const paperLoss = isLossScenario ? totalCost - expectedSale : 0;

      return {
        id: String(p._id),
        title: p.title,
        city: p.city || "",
        listingStatus: p.listingStatus,
        constructionStatus: p.constructionStatus,
        totalCost,
        expectedSellingPrice: expectedSale,
        grossProjectProfit,
        isLossScenario,
        paperLoss,
        investorProfitSharePct: Number(p.investorProfitShare ?? 75),
        hiveProfitSharePct: Number(p.hiveProfitShare ?? 25),
        projectedInvestorShare,
        projectedHiveShare,
        investorProfitPaid,
        unrealizedInvestorProfit,
        totalPrincipalRaised: Number(inv.totalPrincipal || 0),
        investmentCount: inv.count || 0,
        profitByInvestmentStatus: profitByStatusMap,
      };
    })
  );

  const summary = rows.reduce(
    (acc, row) => {
      acc.totalCost += row.totalCost;
      acc.totalPrincipalRaised += row.totalPrincipalRaised;
      acc.investorProfitPaid += row.investorProfitPaid;
      acc.projectedInvestorShare += row.projectedInvestorShare || 0;
      acc.projectedHiveShare += row.projectedHiveShare || 0;
      if (row.isLossScenario) acc.lossScenarioCount += 1;
      if (row.grossProjectProfit != null && row.grossProjectProfit > 0) {
        acc.totalProjectedProfit += row.grossProjectProfit;
      }
      return acc;
    },
    {
      totalCost: 0,
      totalPrincipalRaised: 0,
      investorProfitPaid: 0,
      projectedInvestorShare: 0,
      projectedHiveShare: 0,
      totalProjectedProfit: 0,
      lossScenarioCount: 0,
    }
  );

  return { summary, properties: rows };
}

export async function buildInvestorProfile(investorId) {
  const oid = toObjectId(investorId);
  if (!oid) return null;

  const investor = await Investor.findById(oid)
    .select("fullName email phone cnic address status createdAt updatedAt")
    .lean();

  if (!investor) return null;

  const [investments, cheques, invAgg] = await Promise.all([
    Investment.find({ investorId: oid })
      .sort({ investmentDate: -1 })
      .select("propertyId amount profitAmount sharePercentage status investmentDate paymentMethod profitDistributions")
      .populate("propertyId", "title city listingStatus constructionStatus totalCost investorFundingRequired")
      .lean(),
    SecurityCheque.find({ investorId: oid })
      .sort({ issueDate: -1 })
      .populate("propertyId", "title city")
      .lean(),
    Investment.aggregate([
      { $match: { investorId: oid } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalProfit: { $sum: "$profitAmount" },
        },
      },
    ]),
  ]);

  const byStatus = {};
  let totalInvested = 0;
  let totalProfit = 0;
  for (const row of invAgg) {
    byStatus[row._id] = {
      count: row.count,
      totalAmount: Number(row.totalAmount || 0),
      totalProfit: Number(row.totalProfit || 0),
    };
    totalInvested += Number(row.totalAmount || 0);
    totalProfit += Number(row.totalProfit || 0);
  }

  return {
    profile: {
      id: String(investor._id),
      fullName: investor.fullName,
      email: investor.email,
      phone: investor.phone || "",
      cnic: investor.cnic || "",
      address: investor.address || "",
      status: investor.status,
      joinedAt: investor.createdAt,
      updatedAt: investor.updatedAt,
    },
    summary: {
      totalInvested,
      totalProfit,
      investmentCount: investments.length,
      chequesCount: cheques.length,
      byStatus,
    },
    investments: investments.map((inv) => ({
      id: String(inv._id),
      propertyId: inv.propertyId?._id ? String(inv.propertyId._id) : String(inv.propertyId || ""),
      propertyTitle: inv.propertyId?.title || "Property",
      propertyCity: inv.propertyId?.city || "",
      propertyStatus: inv.propertyId?.listingStatus || "",
      amount: Number(inv.amount || 0),
      profitAmount: Number(inv.profitAmount || 0),
      sharePercentage: Number(inv.sharePercentage || 0),
      status: inv.status,
      investmentDate: inv.investmentDate,
      paymentMethod: inv.paymentMethod || "",
    })),
    cheques: cheques.map((c) => ({
      id: String(c._id),
      chequeNumber: c.chequeNumber,
      propertyTitle: c.propertyId?.title || "Property",
      principalAmount: Number(c.principalAmount || 0),
      status: c.status,
      issueDate: c.issueDate,
      maturityDate: c.maturityDate || null,
    })),
    activity: investments
      .flatMap((inv) => {
        const events = [
          {
            type: "investment",
            date: inv.investmentDate,
            label: `Invested in ${inv.propertyId?.title || "property"}`,
            amount: Number(inv.amount || 0),
            propertyTitle: inv.propertyId?.title || "",
          },
        ];
        if (Array.isArray(inv.profitDistributions)) {
          for (const dist of inv.profitDistributions) {
            events.push({
              type: "profit",
              date: dist.distributedAt,
              label: `Profit received — ${inv.propertyId?.title || "property"}`,
              amount: Number(dist.amount || 0),
              propertyTitle: inv.propertyId?.title || "",
              note: dist.note || "",
            });
          }
        }
        return events;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
  };
}

export async function buildProfitSharingAuditReport({ propertyId } = {}) {
  const propertyFilter = {};
  if (propertyId) {
    const oid = toObjectId(propertyId);
    if (oid) propertyFilter._id = oid;
  }

  const properties = await Property.find(propertyFilter)
    .select("title city investorProfitShare hiveProfitShare totalCost expectedSellingPrice")
    .lean();

  const rows = await Promise.all(
    properties.map(async (p) => {
      const shareCheck = validatePropertyProfitShare(p);
      const { investorPct, hivePct } = {
        investorPct: Number(p.investorProfitShare ?? 75),
        hivePct: Number(p.hiveProfitShare ?? 25),
      };

      const [invAgg, distributions] = await Promise.all([
        Investment.aggregate([
          { $match: { propertyId: p._id } },
          {
            $group: {
              _id: null,
              investorProfitPaid: { $sum: "$profitAmount" },
              totalPrincipal: { $sum: "$amount" },
            },
          },
        ]),
        PropertyProfitDistribution.find({ propertyId: p._id })
          .sort({ distributedAt: -1 })
          .lean(),
      ]);

      const paid = Number(invAgg[0]?.investorProfitPaid || 0);
      const ledgerInvestorTotal = distributions.reduce(
        (sum, d) => sum + Number(d.investorPoolAmount || 0),
        0
      );
      const ledgerHiveTotal = distributions.reduce(
        (sum, d) => sum + Number(d.hiveAmount || 0),
        0
      );
      const ledgerProjectProfit = distributions.reduce(
        (sum, d) => sum + Number(d.totalProjectProfit || 0),
        0
      );

      const investorPaidMatchesLedger = Math.abs(paid - ledgerInvestorTotal) <= 1;

      return {
        id: String(p._id),
        title: p.title,
        city: p.city || "",
        investorProfitSharePct: investorPct,
        hiveProfitSharePct: hivePct,
        profitShareValid: shareCheck.valid,
        profitShareMessage: shareCheck.valid ? "" : shareCheck.message,
        investorProfitPaid: paid,
        ledgerInvestorTotal,
        ledgerHiveTotal,
        ledgerProjectProfit,
        distributionEventCount: distributions.length,
        investorPaidMatchesLedger,
        recentDistributions: distributions.slice(0, 5).map((d) => ({
          id: String(d._id),
          totalProjectProfit: Number(d.totalProjectProfit || 0),
          investorPoolAmount: Number(d.investorPoolAmount || 0),
          hiveAmount: Number(d.hiveAmount || 0),
          investorProfitSharePct: Number(d.investorProfitSharePct || 0),
          hiveProfitSharePct: Number(d.hiveProfitSharePct || 0),
          distributedAt: d.distributedAt,
          note: d.note || "",
        })),
      };
    })
  );

  const summary = rows.reduce(
    (acc, row) => {
      acc.properties += 1;
      if (!row.profitShareValid) acc.invalidShareConfig += 1;
      if (!row.investorPaidMatchesLedger && row.distributionEventCount > 0) {
        acc.ledgerMismatch += 1;
      }
      acc.investorProfitPaid += row.investorProfitPaid;
      acc.hiveProfitRecorded += row.ledgerHiveTotal;
      acc.totalDistributedEvents += row.distributionEventCount;
      return acc;
    },
    {
      properties: 0,
      invalidShareConfig: 0,
      ledgerMismatch: 0,
      investorProfitPaid: 0,
      hiveProfitRecorded: 0,
      totalDistributedEvents: 0,
    }
  );

  return { summary, properties: rows };
}
