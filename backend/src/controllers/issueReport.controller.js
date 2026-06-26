import { Organization } from "../models/Organization.js"
import { getTenantIssueReportModel } from "../models/tenant/TenantIssueReport.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function serializeReport(doc, orgNameById) {
  return {
    id: doc._id,
    orgId: doc.orgId,
    orgName: orgNameById.get(doc.orgId) ?? null,
    studentId: doc.studentId,
    studentName: doc.studentName,
    homeworkId: doc.homeworkId ?? null,
    controlWorkId: doc.controlWorkId ?? null,
    stepIndex: doc.stepIndex ?? null,
    exerciseSlug: doc.exerciseSlug,
    exerciseTitle: doc.exerciseTitle,
    exerciseKind: doc.exerciseKind,
    questionIndex: doc.questionIndex ?? null,
    questionId: doc.questionId ?? null,
    questionPrompt: doc.questionPrompt ?? null,
    message: doc.message ?? null,
    status: doc.status,
    resolvedAt: doc.resolvedAt ?? null,
    resolvedById: doc.resolvedById ?? null,
    resolvedByName: doc.resolvedByName ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

async function orgNameMap(orgIds) {
  const unique = [...new Set(orgIds.filter(Boolean))]
  if (unique.length === 0) return new Map()
  const orgs = await Organization.find({ _id: { $in: unique } })
    .select("_id name")
    .lean()
  return new Map(orgs.map((o) => [o._id, o.name]))
}

export const listIssueReports = asyncHandler(async (req, res) => {
  const IssueReport = getTenantIssueReportModel()
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50))
  const skip = (page - 1) * limit

  const filter = {}
  if (req.query.status && req.query.status !== "all") {
    filter.status = req.query.status
  }
  if (req.query.exerciseKind && req.query.exerciseKind !== "all") {
    filter.exerciseKind = req.query.exerciseKind
  }
  if (req.query.orgId && req.query.orgId !== "all") {
    filter.orgId = req.query.orgId
  }

  const search = String(req.query.search ?? "").trim()
  if (search) {
    const safe = escapeRegex(search)
    filter.$or = [
      { studentName: { $regex: safe, $options: "i" } },
      { exerciseTitle: { $regex: safe, $options: "i" } },
      { exerciseSlug: { $regex: safe, $options: "i" } },
      { questionPrompt: { $regex: safe, $options: "i" } },
      { message: { $regex: safe, $options: "i" } },
    ]
  }

  const openFilter = { ...filter, status: "open" }

  const [items, total, openCount] = await Promise.all([
    IssueReport.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    IssueReport.countDocuments(filter),
    IssueReport.countDocuments(openFilter),
  ])

  const orgNames = await orgNameMap(items.map((d) => d.orgId))

  res.json({
    items: items.map((doc) => serializeReport(doc, orgNames)),
    total,
    openCount,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
  })
})

export const updateIssueReport = asyncHandler(async (req, res) => {
  const IssueReport = getTenantIssueReportModel()
  const { status } = req.body

  const doc = await IssueReport.findById(req.params.id)
  if (!doc) throw ApiError.notFound("Issue report not found")

  doc.status = status
  if (status === "resolved" || status === "dismissed") {
    doc.resolvedAt = new Date()
    doc.resolvedById = req.user.id
    doc.resolvedByName = req.user.name ?? "Platform staff"
  } else {
    doc.resolvedAt = null
    doc.resolvedById = null
    doc.resolvedByName = null
  }

  await doc.save()

  const orgNames = await orgNameMap([doc.orgId])
  res.json(serializeReport(doc.toObject(), orgNames))
})
