import { Subscription } from "../models/Subscription.js"
import { PlatformPayment } from "../models/PlatformPayment.js"
import { Organization } from "../models/Organization.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { recordAudit } from "../services/audit.service.js"

export const listSubscriptions = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.query.orgId) filter.orgId = req.query.orgId
  if (req.query.status) filter.status = req.query.status
  const subs = await Subscription.find(filter).sort({ createdAt: -1 })
  const orgIds = [...new Set(subs.map((s) => s.orgId))]
  const orgs = await Organization.find({ _id: { $in: orgIds } }).select("_id name subdomain plan")
  const orgMap = Object.fromEntries(orgs.map((o) => [o._id, o]))

  res.json(
    subs.map((s) => ({
      ...s.toJSON(),
      orgName: orgMap[s.orgId]?.name ?? null,
      orgSubdomain: orgMap[s.orgId]?.subdomain ?? null,
    })),
  )
})

export const updateSubscription = asyncHandler(async (req, res) => {
  const sub = await Subscription.findById(req.params.id)
  if (!sub) throw ApiError.notFound("Subscription not found")

  const patch = { ...req.body }
  if (patch.trialEndsAt === null) sub.trialEndsAt = undefined
  else if (patch.trialEndsAt) sub.trialEndsAt = new Date(patch.trialEndsAt)
  delete patch.trialEndsAt
  if (patch.currentPeriodEnd === null) sub.currentPeriodEnd = undefined
  else if (patch.currentPeriodEnd) sub.currentPeriodEnd = new Date(patch.currentPeriodEnd)
  delete patch.currentPeriodEnd

  Object.assign(sub, patch)
  if (patch.status === "canceled") sub.canceledAt = new Date()
  await sub.save()

  if (patch.plan) {
    await Organization.findByIdAndUpdate(sub.orgId, { plan: patch.plan })
  }

  await recordAudit({
    req,
    action: "update",
    category: "billing",
    targetType: "subscription",
    targetId: sub._id,
    targetLabel: sub.plan,
    orgId: sub.orgId,
    details: { patch: req.body },
  })

  res.json(sub.toJSON())
})

export const listPayments = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.query.orgId) filter.orgId = req.query.orgId
  if (req.query.status) filter.status = req.query.status
  const payments = await PlatformPayment.find(filter).sort({ createdAt: -1 })
  const orgIds = [...new Set(payments.map((p) => p.orgId))]
  const orgs = await Organization.find({ _id: { $in: orgIds } }).select("_id name")
  const orgMap = Object.fromEntries(orgs.map((o) => [o._id, o.name]))

  res.json(
    payments.map((p) => ({
      ...p.toJSON(),
      orgName: orgMap[p.orgId] ?? null,
    })),
  )
})

export const createPayment = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.body.orgId)
  if (!org) throw ApiError.notFound("Organization not found")

  const payment = await PlatformPayment.create({
    ...req.body,
    paidAt: req.body.status === "paid" ? new Date() : undefined,
  })

  await recordAudit({
    req,
    action: "create",
    category: "billing",
    targetType: "payment",
    targetId: payment._id,
    targetLabel: `${payment.amount} ${payment.currency}`,
    orgId: payment.orgId,
    details: { amount: payment.amount, periodLabel: payment.periodLabel },
  })

  res.status(201).json(payment.toJSON())
})

export const billingSummary = asyncHandler(async (_req, res) => {
  const [activeSubs, trialing, pastDue, paidTotal] = await Promise.all([
    Subscription.countDocuments({ status: "active" }),
    Subscription.countDocuments({ status: "trialing" }),
    Subscription.countDocuments({ status: "past_due" }),
    PlatformPayment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ])
  res.json({
    activeSubs,
    trialing,
    pastDue,
    revenueTotal: paidTotal[0]?.total ?? 0,
  })
})
