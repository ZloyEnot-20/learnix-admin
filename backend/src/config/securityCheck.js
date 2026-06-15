import { env, isProd } from "./env.js"

const WEAK_JWT_MARKERS = ["change_me", "changeme", "change-me", "secret", "min-32-chars"]

function looksWeakSecret(value) {
  const v = String(value ?? "").trim().toLowerCase()
  if (!v || v.length < 32) return true
  return WEAK_JWT_MARKERS.some((m) => v.includes(m))
}

export function validateSecurityConfig() {
  if (!isProd) return

  if (looksWeakSecret(env.jwt.accessSecret) || looksWeakSecret(env.jwt.refreshSecret)) {
    throw new Error(
      "[security] Set strong JWT_ACCESS_SECRET and JWT_REFRESH_SECRET (32+ random chars) in production",
    )
  }

  if (env.corsDisabled) {
    console.warn("[security] CORS_DISABLED=true — all browser origins allowed; disable for public production")
  } else if (!env.corsOrigins.trim()) {
    throw new Error("[security] CORS_ORIGINS must be set in production")
  }
}
