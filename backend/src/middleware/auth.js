import { verifyAccessToken } from "../utils/jwt.js"
import { PlatformUser } from "../models/PlatformUser.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization ?? ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) throw ApiError.unauthorized("Missing access token")

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch {
    throw ApiError.unauthorized("Invalid or expired token")
  }

  const user = await PlatformUser.findById(payload.sub)
  if (!user || !user.isActive) throw ApiError.unauthorized("Account no longer exists")

  req.user = {
    id: user._id,
    role: user.role,
    name: user.name,
    email: user.email,
    orgId: user.orgId ?? null,
  }
  next()
})

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized())
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden())
    next()
  }
}

/** Platform staff only (not org owners). */
export const isPlatformStaff = authorize("super_admin", "platform_admin")

export const isSuperAdmin = authorize("super_admin")
