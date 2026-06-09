import { PlatformAuditLog } from "../models/PlatformAuditLog.js"
import { ErrorLog } from "../models/ErrorLog.js"
import { asyncHandler } from "../utils/asyncHandler.js"

export const listAuditLogs = asyncHandler(async (req, res) => {
  const page = req.query.page ?? 1
  const limit = req.query.limit ?? 30
  const filter = {}
  if (req.query.category) filter.category = req.query.category
  if (req.query.orgId) filter.orgId = req.query.orgId

  const [items, total] = await Promise.all([
    PlatformAuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PlatformAuditLog.countDocuments(filter),
  ])

  res.json({
    items: items.map((l) => ({
      id: l._id,
      action: l.action,
      category: l.category,
      actorId: l.actorId,
      actorName: l.actorName,
      actorRole: l.actorRole,
      targetType: l.targetType,
      targetId: l.targetId,
      targetLabel: l.targetLabel,
      orgId: l.orgId,
      details: l.details,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  })
})

export const listErrorLogs = asyncHandler(async (req, res) => {
  const page = req.query.page ?? 1
  const limit = req.query.limit ?? 30
  const filter = {}
  if (req.query.level) filter.level = req.query.level
  if (req.query.orgId) filter.orgId = req.query.orgId

  const [items, total] = await Promise.all([
    ErrorLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ErrorLog.countDocuments(filter),
  ])

  res.json({
    items: items.map((e) => e.toJSON()),
    total,
    page,
    pages: Math.ceil(total / limit),
  })
})
