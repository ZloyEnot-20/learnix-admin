import { connectTenantDB } from "../config/tenantDb.js"
import { getTenantUserModel } from "../models/tenant/TenantUser.js"
import { getTenantSubmissionModel } from "../models/tenant/TenantSubmission.js"
import { getTenantStudentActivityModel } from "../models/tenant/TenantStudentActivity.js"

const COMPLETED_STATUSES = ["submitted", "graded"]

function startOfUtcDay(date) {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function endOfUtcDay(date) {
  const d = startOfUtcDay(date)
  d.setUTCHours(23, 59, 59, 999)
  return d
}

function formatDay(date) {
  return date.toISOString().slice(0, 10)
}

function buildDayRange(from, to) {
  const days = []
  const cursor = startOfUtcDay(from)
  const end = startOfUtcDay(to)
  while (cursor <= end) {
    days.push(formatDay(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

function mapSeries(rows, dayKeys) {
  const byDate = new Map(rows.map((r) => [r._id, r.count]))
  return dayKeys.map((date) => ({ date, count: byDate.get(date) ?? 0 }))
}

function withOrg(orgId, filter = {}) {
  if (!orgId) return filter
  return { ...filter, orgId }
}

const activeStudentFilter = {
  type: "student",
  $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
}

function resolveRange({ days = 60, from: fromInput, to: toInput } = {}) {
  if (fromInput && toInput) {
    const from = startOfUtcDay(fromInput)
    const to = startOfUtcDay(toInput)
    return { from, to, toEnd: endOfUtcDay(toInput) }
  }

  const to = startOfUtcDay(new Date())
  const from = startOfUtcDay(new Date())
  from.setUTCDate(from.getUTCDate() - (days - 1))
  return { from, to, toEnd: endOfUtcDay(to) }
}

export async function getPlatformAnalytics({ days = 60, orgId = null, from, to } = {}) {
  await connectTenantDB()
  const Submission = getTenantSubmissionModel()
  const StudentActivity = getTenantStudentActivityModel()
  const TenantUser = getTenantUserModel()

  const range = resolveRange({ days, from, to })
  const dayKeys = buildDayRange(range.from, range.to)

  const [
    totalHomeworkCompletions,
    uniqueStudents,
    homeworkRows,
    activeRows,
    newStudentRows,
  ] = await Promise.all([
    Submission.countDocuments(
      withOrg(orgId, {
        status: { $in: COMPLETED_STATUSES },
        submittedAt: { $gte: range.from, $lte: range.toEnd },
      }),
    ),
    TenantUser.countDocuments(withOrg(orgId, activeStudentFilter)),
    Submission.aggregate([
      {
        $match: withOrg(orgId, {
          status: { $in: COMPLETED_STATUSES },
          submittedAt: { $gte: range.from, $lte: range.toEnd },
        }),
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$submittedAt", timezone: "UTC" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    StudentActivity.aggregate([
      { $match: withOrg(orgId, { at: { $gte: range.from, $lte: range.toEnd } }) },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$at", timezone: "UTC" } },
            studentId: "$studentId",
          },
        },
      },
      { $group: { _id: "$_id.date", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    TenantUser.aggregate([
      {
        $match: withOrg(orgId, {
          type: "student",
          joinedAt: { $gte: range.from, $lte: range.toEnd },
        }),
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$joinedAt", timezone: "UTC" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ])

  return {
    totalHomeworkCompletions,
    uniqueStudents,
    homeworkByDay: mapSeries(homeworkRows, dayKeys),
    activeStudentsByDay: mapSeries(activeRows, dayKeys),
    newStudentsByDay: mapSeries(newStudentRows, dayKeys),
    from: formatDay(range.from),
    to: formatDay(range.to),
    days: dayKeys.length,
    orgId,
  }
}
