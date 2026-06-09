import { PlatformUser } from "../models/PlatformUser.js"
import { Organization } from "../models/Organization.js"
import { Subscription } from "../models/Subscription.js"
import { PlatformPayment } from "../models/PlatformPayment.js"
import { PlatformAuditLog } from "../models/PlatformAuditLog.js"
import { asyncHandler } from "../utils/asyncHandler.js"

export const dashboard = asyncHandler(async (_req, res) => {
  const [orgs, users, subs, revenue, recentAudit] = await Promise.all([
    Organization.countDocuments(),
    PlatformUser.countDocuments({ orgId: { $ne: null } }),
    Subscription.countDocuments({ status: "trialing" }),
    PlatformPayment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    PlatformAuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
  ])

  res.json({
    organizations: orgs,
    orgUsers: users,
    trialsActive: subs,
    revenueTotal: revenue[0]?.total ?? 0,
    recentActivity: recentAudit.map((l) => ({
      id: l._id,
      category: l.category,
      action: l.action,
      actorName: l.actorName,
      targetLabel: l.targetLabel,
      createdAt: l.createdAt,
    })),
  })
})
