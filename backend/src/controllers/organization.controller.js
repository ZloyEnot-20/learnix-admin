import { Organization } from "../models/Organization.js"
import { PlatformUser } from "../models/PlatformUser.js"
import { Subscription } from "../models/Subscription.js"
import { PlatformConfig } from "../models/PlatformConfig.js"
import { OwnerClaim } from "../models/OwnerClaim.js"
import { hashPassword } from "../utils/password.js"
import { generatePassword, normalizeLogin } from "../utils/generate.js"
import { createOwnerClaim } from "../services/ownerClaim.service.js"
import { provisionTenantAdmin } from "../services/tenantProvision.service.js"
import { purgeTenantData } from "../services/tenantPurge.service.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { recordAudit } from "../services/audit.service.js"
import { getTenantUsage } from "../services/tenantStats.service.js"

async function getDefaultLimits(plan) {
  const cfg = (await PlatformConfig.findById("platform")) ?? (await PlatformConfig.create({ _id: "platform" }))
  return cfg.defaultLimits?.[plan] ?? { maxStudents: 50, maxTeachers: 5 }
}

export const listOrganizations = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.query.status) filter.status = req.query.status
  if (req.query.plan) filter.plan = req.query.plan
  const orgs = await Organization.find(filter).sort({ createdAt: -1 })
  res.json(orgs.map((o) => o.toJSON()))
})

export const getOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id)
  if (!org) throw ApiError.notFound("Organization not found")
  const [platformUserCount, subscription, usage] = await Promise.all([
    PlatformUser.countDocuments({ orgId: org._id }),
    Subscription.findOne({ orgId: org._id }).sort({ createdAt: -1 }),
    getTenantUsage(org._id),
  ])
  res.json({
    ...org.toJSON(),
    userCount: platformUserCount,
    ...usage,
    subscription: subscription?.toJSON() ?? null,
  })
})

export const createOrganization = asyncHandler(async (req, res) => {
  const existing = await Organization.findOne({ subdomain: req.body.subdomain.toLowerCase() })
  if (existing) throw ApiError.conflict("Subdomain already taken")

  const plan = req.body.plan ?? "free"
  const defaults = await getDefaultLimits(plan)
  const cfg = await PlatformConfig.findById("platform")
  const trialDays = req.body.trialDays ?? cfg?.trialDays ?? 14
  const trialEndsAt = trialDays > 0 ? new Date(Date.now() + trialDays * 86400000) : null

  const org = await Organization.create({
    name: req.body.name,
    subdomain: req.body.subdomain.toLowerCase(),
    plan,
    limits: req.body.limits ?? defaults,
    trialEndsAt,
  })

  await Subscription.create({
    orgId: org._id,
    plan,
    status: trialEndsAt ? "trialing" : "active",
    trialEndsAt,
    currentPeriodStart: new Date(),
    currentPeriodEnd: trialEndsAt,
  })

  let owner = null
  let ownerClaim = null
  if (req.body.ownerLogin && req.body.ownerName) {
    const login = normalizeLogin(req.body.ownerLogin)
    const loginTaken = await PlatformUser.findOne({ login })
    if (loginTaken) throw ApiError.conflict("Owner login already taken")

    const email = `${login}@${org.subdomain}.learnix`
    const emailTaken = await PlatformUser.findOne({ email })
    if (emailTaken) throw ApiError.conflict("Owner email already registered")

    const plainPassword = generatePassword()
    owner = await PlatformUser.create({
      email,
      login,
      name: req.body.ownerName.trim(),
      passwordHash: await hashPassword(plainPassword),
      role: "owner",
      orgId: org._id,
    })

    await provisionTenantAdmin({
      orgId: org._id,
      login,
      email,
      name: owner.name,
      plainPassword,
    })

    const claim = await createOwnerClaim(owner._id, org._id, plainPassword)
    ownerClaim = {
      login,
      code: claim.code,
      expiresAt: claim.expiresAt,
    }
  }

  await recordAudit({
    req,
    action: "create",
    category: "organizations",
    targetType: "organization",
    targetId: org._id,
    targetLabel: org.name,
    orgId: org._id,
    details: { subdomain: org.subdomain, plan, ownerId: owner?._id ?? null },
  })

  res.status(201).json({ ...org.toJSON(), ownerClaim })
})

export const updateOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id)
  if (!org) throw ApiError.notFound("Organization not found")

  const patch = { ...req.body }
  if (patch.trialEndsAt === null) org.trialEndsAt = undefined
  else if (patch.trialEndsAt) org.trialEndsAt = new Date(patch.trialEndsAt)
  delete patch.trialEndsAt

  if (patch.plan && patch.plan !== org.plan) {
    const defaults = await getDefaultLimits(patch.plan)
    if (!patch.limits) org.limits = defaults
  }

  Object.assign(org, patch)
  await org.save()

  if (patch.plan) {
    await Subscription.findOneAndUpdate(
      { orgId: org._id, status: { $ne: "canceled" } },
      { plan: patch.plan },
      { sort: { createdAt: -1 } },
    )
  }

  await recordAudit({
    req,
    action: "update",
    category: "organizations",
    targetType: "organization",
    targetId: org._id,
    targetLabel: org.name,
    orgId: org._id,
    details: { patch: req.body },
  })

  res.json(org.toJSON())
})

export const deleteOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findByIdAndDelete(req.params.id)
  if (!org) throw ApiError.notFound("Organization not found")

  const orgUsers = await PlatformUser.find({ orgId: org._id }).select("_id").lean()
  const ownerIds = orgUsers.map((u) => u._id)

  await Promise.all([
    PlatformUser.deleteMany({ orgId: org._id }),
    Subscription.deleteMany({ orgId: org._id }),
    OwnerClaim.deleteMany({ $or: [{ orgId: org._id }, { ownerId: { $in: ownerIds } }] }),
    purgeTenantData(org._id),
  ])

  await recordAudit({
    req,
    action: "delete",
    category: "organizations",
    targetType: "organization",
    targetId: org._id,
    targetLabel: org.name,
    orgId: org._id,
  })

  res.json({ ok: true })
})

/** Regenerate owner credentials and (re)provision the tenant admin account for learnix-front login. */
export const resetOwnerAccess = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id)
  if (!org) throw ApiError.notFound("Organization not found")

  const owner = await PlatformUser.findOne({ orgId: org._id, role: "owner" })
  if (!owner) throw ApiError.notFound("Organization owner not found")

  const login = owner.login ?? owner.email.split("@")[0]
  const plainPassword = generatePassword()

  owner.passwordHash = await hashPassword(plainPassword)
  await owner.save()

  await provisionTenantAdmin({
    orgId: org._id,
    login,
    email: owner.email,
    name: owner.name,
    plainPassword,
  })

  const claim = await createOwnerClaim(owner._id, org._id, plainPassword)

  await recordAudit({
    req,
    action: "reset_owner_access",
    category: "organizations",
    targetType: "organization",
    targetId: org._id,
    targetLabel: org.name,
    orgId: org._id,
    details: { ownerId: owner._id, login },
  })

  res.json({
    login,
    code: claim.code,
    expiresAt: claim.expiresAt,
  })
})

export const orgStats = asyncHandler(async (_req, res) => {
  const [total, active, blocked, free, pro, trialing] = await Promise.all([
    Organization.countDocuments(),
    Organization.countDocuments({ status: "active" }),
    Organization.countDocuments({ status: "blocked" }),
    Organization.countDocuments({ plan: "free" }),
    Organization.countDocuments({ plan: "pro" }),
    Subscription.countDocuments({ status: "trialing" }),
  ])
  res.json({ total, active, blocked, free, pro, trialing })
})
