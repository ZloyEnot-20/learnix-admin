import { PlatformUser } from "../models/PlatformUser.js"
import { hashPassword, verifyPassword } from "../utils/password.js"
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { recordAudit } from "../services/audit.service.js"

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const user = await PlatformUser.findOne({ email: email.toLowerCase() })
  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    throw ApiError.unauthorized("Invalid email or password")
  }
  if (!user.isActive) throw ApiError.forbidden("Account is disabled")
  if (!["super_admin", "platform_admin"].includes(user.role)) {
    throw ApiError.forbidden("Platform admin access only")
  }

  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)

  await recordAudit({
    req,
    actor: { id: user._id, name: user.name, role: user.role },
    action: "login",
    category: "auth",
    targetType: "user",
    targetId: user._id,
    targetLabel: user.email,
  })

  res.json({
    accessToken,
    refreshToken,
    user: user.toSafeJSON(),
  })
})

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body
  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw ApiError.unauthorized("Invalid refresh token")
  }

  const user = await PlatformUser.findById(payload.sub)
  if (!user || !user.isActive) throw ApiError.unauthorized("Account no longer exists")
  if (!["super_admin", "platform_admin"].includes(user.role)) {
    throw ApiError.forbidden("Platform admin access only")
  }

  res.json({
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  })
})

export const me = asyncHandler(async (req, res) => {
  const user = await PlatformUser.findById(req.user.id)
  if (!user) throw ApiError.notFound("User not found")
  res.json(user.toSafeJSON())
})
