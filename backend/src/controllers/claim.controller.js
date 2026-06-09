import { OwnerClaim } from "../models/OwnerClaim.js"
import { PlatformUser } from "../models/PlatformUser.js"
import { Organization } from "../models/Organization.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { claimStatus } from "../services/ownerClaim.service.js"

export const listClaims = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.query.orgId) filter.orgId = req.query.orgId

  const claims = await OwnerClaim.find(filter).sort({ createdAt: -1 }).limit(200)
  const ownerIds = [...new Set(claims.map((c) => c.ownerId))]
  const orgIds = [...new Set(claims.map((c) => c.orgId))]

  const [owners, orgs] = await Promise.all([
    PlatformUser.find({ _id: { $in: ownerIds } }).lean(),
    Organization.find({ _id: { $in: orgIds } }).lean(),
  ])
  const ownerById = new Map(owners.map((o) => [o._id, o]))
  const orgById = new Map(orgs.map((o) => [o._id, o]))

  res.json(
    claims.map((c) => ({
      id: c._id,
      ownerId: c.ownerId,
      ownerLogin: ownerById.get(c.ownerId)?.login ?? null,
      ownerName: ownerById.get(c.ownerId)?.name ?? null,
      orgId: c.orgId,
      orgName: orgById.get(c.orgId)?.name ?? null,
      code: c.code,
      expiresAt: c.expiresAt,
      usedAt: c.usedAt ?? null,
      status: claimStatus(c),
      createdAt: c.createdAt,
    })),
  )
})
