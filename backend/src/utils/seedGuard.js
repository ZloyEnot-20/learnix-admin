import { isProd } from "../config/env.js"

const WEAK_PASSWORDS = new Set(["admin123", "demo123", "change-me", "changeme"])

export function assertSeedPassword(label, password) {
  if (!isProd) return
  const value = String(password ?? "").trim()
  if (!value || value.length < 12) {
    throw new Error(`[seed] In production set a strong ${label} (min 12 characters) via env`)
  }
  if (WEAK_PASSWORDS.has(value)) {
    throw new Error(`[seed] In production ${label} must not use a default/weak password`)
  }
  const lower = value.toLowerCase()
  if (lower.includes("change-me") || lower.includes("changeme") || lower.includes("admin123")) {
    throw new Error(`[seed] In production ${label} looks weak — choose a unique secret`)
  }
}
