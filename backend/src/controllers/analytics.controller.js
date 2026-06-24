import { Organization } from "../models/Organization.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getPlatformAnalytics } from "../services/platformAnalytics.service.js"

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

function parseDayParam(value) {
  if (typeof value !== "string" || !DAY_RE.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

export const platformAnalytics = asyncHandler(async (req, res) => {
  const rawDays = Number(req.query.days)
  const days = Number.isFinite(rawDays) ? Math.min(Math.max(rawDays, 7), 365) : 60

  let orgId = typeof req.query.orgId === "string" ? req.query.orgId.trim() : null
  let orgName = null

  if (!orgId || orgId === "all") {
    orgId = null
  } else {
    const org = await Organization.findById(orgId).select("name").lean()
    if (!org) throw ApiError.notFound("Organization not found")
    orgName = org.name
  }

  const fromParam = parseDayParam(req.query.from)
  const toParam = parseDayParam(req.query.to)

  if (req.query.from && !fromParam) {
    throw ApiError.badRequest("Invalid from date — use YYYY-MM-DD")
  }
  if (req.query.to && !toParam) {
    throw ApiError.badRequest("Invalid to date — use YYYY-MM-DD")
  }
  if ((fromParam && !toParam) || (!fromParam && toParam)) {
    throw ApiError.badRequest("Both from and to dates are required")
  }
  if (fromParam && toParam) {
    if (fromParam > toParam) {
      throw ApiError.badRequest("from must be on or before to")
    }
    const spanDays = Math.floor((toParam - fromParam) / 86_400_000) + 1
    if (spanDays > 365) {
      throw ApiError.badRequest("Date range cannot exceed 365 days")
    }
  }

  const data = await getPlatformAnalytics({
    days,
    orgId,
    from: fromParam ?? undefined,
    to: toParam ?? undefined,
  })

  res.json({ ...data, orgName })
})
