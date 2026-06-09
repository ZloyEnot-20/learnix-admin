import { PlatformUser } from "../models/PlatformUser.js"
import { Organization } from "../models/Organization.js"
import { hashPassword } from "../utils/password.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { recordAudit } from "../services/audit.service.js"

export const listUsers = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.query.orgId) filter.orgId = req.query.orgId
  if (req.query.role) filter.role = req.query.role
  const users = await PlatformUser.find(filter).sort({ createdAt: -1 })
  const orgIds = [...new Set(users.map((u) => u.orgId).filter(Boolean))]
  const orgs = await Organization.find({ _id: { $in: orgIds } }).select("_id name subdomain")
  const orgMap = Object.fromEntries(orgs.map((o) => [o._id, o.name]))

  res.json(
    users.map((u) => ({
      ...u.toSafeJSON(),
      orgName: u.orgId ? (orgMap[u.orgId] ?? null) : null,
    })),
  )
})

export const createUser = asyncHandler(async (req, res) => {
  const { email, name, password, role, orgId } = req.body

  if (["owner", "org_admin"].includes(role) && !orgId) {
    throw ApiError.badRequest("orgId required for organization users")
  }
  if (role === "platform_admin" && orgId) {
    throw ApiError.badRequest("Platform admins cannot belong to an organization")
  }
  if (orgId) {
    const org = await Organization.findById(orgId)
    if (!org) throw ApiError.notFound("Organization not found")
  }

  const exists = await PlatformUser.findOne({ email: email.toLowerCase() })
  if (exists) throw ApiError.conflict("Email already registered")

  const user = await PlatformUser.create({
    email: email.toLowerCase(),
    name,
    passwordHash: await hashPassword(password),
    role,
    orgId: orgId ?? null,
  })

  await recordAudit({
    req,
    action: "create",
    category: "users",
    targetType: "user",
    targetId: user._id,
    targetLabel: user.email,
    orgId: user.orgId,
    details: { role, name },
  })

  res.status(201).json(user.toSafeJSON())
})

export const updateUser = asyncHandler(async (req, res) => {
  const user = await PlatformUser.findById(req.params.id)
  if (!user) throw ApiError.notFound("User not found")
  if (user.role === "super_admin") throw ApiError.forbidden("Cannot modify super admin")

  const { password, ...rest } = req.body
  Object.assign(user, rest)
  if (password) user.passwordHash = await hashPassword(password)
  await user.save()

  await recordAudit({
    req,
    action: "update",
    category: "users",
    targetType: "user",
    targetId: user._id,
    targetLabel: user.email,
    orgId: user.orgId,
    details: { patch: { ...rest, password: password ? "[changed]" : undefined } },
  })

  res.json(user.toSafeJSON())
})

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await PlatformUser.findById(req.params.id)
  if (!user) throw ApiError.notFound("User not found")
  if (user.role === "super_admin") throw ApiError.forbidden("Cannot delete super admin")
  await user.deleteOne()

  await recordAudit({
    req,
    action: "delete",
    category: "users",
    targetType: "user",
    targetId: user._id,
    targetLabel: user.email,
    orgId: user.orgId,
  })

  res.json({ ok: true })
})
