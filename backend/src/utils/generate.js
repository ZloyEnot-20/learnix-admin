import crypto from "node:crypto"

const PASSWORD_CHARS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"

/** Generate a readable random password (no ambiguous chars). */
export function generatePassword(length = 10) {
  const bytes = crypto.randomBytes(length)
  return Array.from(bytes, (b) => PASSWORD_CHARS[b % PASSWORD_CHARS.length]).join("")
}

/** Normalize login input for storage and lookup. */
export function normalizeLogin(value) {
  return String(value ?? "").trim().toLowerCase()
}
