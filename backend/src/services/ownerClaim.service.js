import { OwnerClaim, generateClaimCode } from "../models/OwnerClaim.js"

const CLAIM_TTL_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Create a fresh one-time 6-digit confirmation code for an org owner.
 * Any previous unused claim for the same owner is invalidated.
 */
export async function createOwnerClaim(ownerId, orgId, plainPassword) {
  await OwnerClaim.deleteMany({ ownerId, usedAt: null })

  const expiresAt = new Date(Date.now() + CLAIM_TTL_MS)
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateClaimCode()
    const active = await OwnerClaim.findOne({ code, usedAt: null })
    if (active) continue
    try {
      await OwnerClaim.create({ ownerId, orgId, code, password: plainPassword, expiresAt })
      return { code, expiresAt }
    } catch (err) {
      if (err?.code !== 11000) throw err
    }
  }
  throw new Error("Could not allocate a confirmation code")
}

export function claimStatus(claim) {
  if (claim.usedAt) return "used"
  if (new Date(claim.expiresAt).getTime() < Date.now()) return "expired"
  return "active"
}
