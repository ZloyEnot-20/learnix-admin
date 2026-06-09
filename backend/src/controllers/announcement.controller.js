import { PlatformAnnouncement } from "../models/PlatformAnnouncement.js"
import { Organization } from "../models/Organization.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { recordAudit } from "../services/audit.service.js"

function normalizeTargetOrgIds(value) {
  if (value == null) return null
  const ids = [...new Set(value.filter(Boolean))]
  return ids.length ? ids : null
}

async function attachOrgNames(items) {
  const orgIds = [
    ...new Set(items.flatMap((a) => a.targetOrgIds ?? []).filter(Boolean)),
  ]
  const orgs = orgIds.length
    ? await Organization.find({ _id: { $in: orgIds } }).select("_id name")
    : []
  const orgMap = Object.fromEntries(orgs.map((o) => [o._id, o.name]))

  return items.map((item) => {
    const json = typeof item.toJSON === "function" ? item.toJSON() : item
    return {
      ...json,
      targetOrgNames:
        json.targetOrgIds?.map((id) => orgMap[id] ?? id) ?? null,
      audience: json.targetOrgIds?.length ? "selected" : "all",
    }
  })
}

export const listAnnouncements = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.query.type) filter.type = req.query.type
  if (req.query.isActive === "true") filter.isActive = true
  if (req.query.isActive === "false") filter.isActive = false

  const items = await PlatformAnnouncement.find(filter).sort({ createdAt: -1 })
  res.json(await attachOrgNames(items))
})

export const createAnnouncement = asyncHandler(async (req, res) => {
  const targetOrgIds = normalizeTargetOrgIds(req.body.targetOrgIds)
  if (targetOrgIds?.length) {
    const count = await Organization.countDocuments({ _id: { $in: targetOrgIds } })
    if (count !== targetOrgIds.length) {
      throw ApiError.badRequest("One or more target organizations not found")
    }
  }

  const announcement = await PlatformAnnouncement.create({
    title: req.body.title,
    message: req.body.message,
    type: req.body.type ?? "news",
    severity: req.body.severity ?? "info",
    targetOrgIds,
    startsAt: req.body.startsAt ? new Date(req.body.startsAt) : new Date(),
    endsAt: req.body.endsAt ? new Date(req.body.endsAt) : undefined,
    isActive: req.body.isActive ?? true,
    createdBy: req.user.name,
  })

  await recordAudit({
    req,
    action: "create",
    category: "announcement",
    targetType: "announcement",
    targetId: announcement._id,
    targetLabel: announcement.title,
    details: {
      type: announcement.type,
      audience: targetOrgIds?.length ? targetOrgIds : "all",
    },
  })

  const [enriched] = await attachOrgNames([announcement])
  res.status(201).json(enriched)
})

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await PlatformAnnouncement.findById(req.params.id)
  if (!announcement) throw ApiError.notFound("Announcement not found")

  const patch = { ...req.body }
  if ("targetOrgIds" in patch) {
    patch.targetOrgIds = normalizeTargetOrgIds(patch.targetOrgIds)
    if (patch.targetOrgIds?.length) {
      const count = await Organization.countDocuments({ _id: { $in: patch.targetOrgIds } })
      if (count !== patch.targetOrgIds.length) {
        throw ApiError.badRequest("One or more target organizations not found")
      }
    }
  }
  if (patch.startsAt) patch.startsAt = new Date(patch.startsAt)
  if (patch.endsAt === null) announcement.endsAt = undefined
  else if (patch.endsAt) patch.endsAt = new Date(patch.endsAt)

  Object.assign(announcement, patch)
  await announcement.save()

  await recordAudit({
    req,
    action: "update",
    category: "announcement",
    targetType: "announcement",
    targetId: announcement._id,
    targetLabel: announcement.title,
    details: { patch: req.body },
  })

  const [enriched] = await attachOrgNames([announcement])
  res.json(enriched)
})

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await PlatformAnnouncement.findById(req.params.id)
  if (!announcement) throw ApiError.notFound("Announcement not found")

  await announcement.deleteOne()

  await recordAudit({
    req,
    action: "delete",
    category: "announcement",
    targetType: "announcement",
    targetId: announcement._id,
    targetLabel: announcement.title,
  })

  res.json({ ok: true })
})
