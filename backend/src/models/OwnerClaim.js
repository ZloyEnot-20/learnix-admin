import mongoose from "mongoose"
import { randomInt } from "node:crypto"
import { uid } from "../utils/ids.js"

/** Generate a 6-digit numeric one-time code (e.g. "048213"). */
export function generateClaimCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0")
}

/**
 * One-time confirmation code for org owner credential delivery via Telegram bot.
 * Plaintext password is stored only until redeemed or expired.
 */
const ownerClaimSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uid("oclaim") },
    ownerId: { type: String, ref: "PlatformUser", required: true, index: true },
    orgId: { type: String, ref: "Organization", required: true, index: true },
    code: { type: String, required: true, index: true },
    password: { type: String, select: false, default: null },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    usedByChatId: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

ownerClaimSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const OwnerClaim = mongoose.model("OwnerClaim", ownerClaimSchema)
