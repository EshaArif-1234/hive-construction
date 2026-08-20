import dbConnect from "@/lib/dbConnect";
import { requireInvestor } from "@/lib/investorSession";
import InvestorNotification, { NOTIFICATION_TYPES } from "@/models/InvestorNotification";
import { serializeNotification } from "@/lib/investorNotifications";

export default async function handler(req, res) {
  const payload = requireInvestor(req, res);
  if (!payload) return;

  const investorId = String(payload.sub);

  if (req.method === "GET") {
    const { type, unreadOnly, limit, skip } = req.query;

    const filter = { investorId };

    if (type && typeof type === "string" && NOTIFICATION_TYPES.includes(type)) {
      filter.type = type;
    }

    if (unreadOnly === "true" || unreadOnly === "1") {
      filter.readAt = null;
    }

    const take = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const offset = Math.max(Number(skip) || 0, 0);

    try {
      await dbConnect();

      const [rows, unreadCount, total] = await Promise.all([
        InvestorNotification.find(filter)
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(take)
          .lean(),
        InvestorNotification.countDocuments({ investorId, readAt: null }),
        InvestorNotification.countDocuments(filter),
      ]);

      return res.status(200).json({
        notifications: rows.map(serializeNotification),
        unreadCount,
        total,
        limit: take,
        skip: offset,
      });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method === "PATCH") {
    const { ids, markAllRead } = req.body ?? {};

    try {
      await dbConnect();

      const now = new Date();
      const baseFilter = { investorId, readAt: null };

      if (markAllRead) {
        const result = await InvestorNotification.updateMany(baseFilter, { $set: { readAt: now } });
        return res.status(200).json({
          message: "All notifications marked as read",
          modifiedCount: result.modifiedCount || 0,
        });
      }

      const idList = Array.isArray(ids)
        ? ids.map((id) => String(id)).filter(Boolean)
        : [];

      if (idList.length === 0) {
        return res.status(400).json({ message: "Provide ids[] or markAllRead: true" });
      }

      const result = await InvestorNotification.updateMany(
        { ...baseFilter, _id: { $in: idList } },
        { $set: { readAt: now } }
      );

      return res.status(200).json({
        message: "Notifications marked as read",
        modifiedCount: result.modifiedCount || 0,
      });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ message: "Method Not Allowed" });
}
