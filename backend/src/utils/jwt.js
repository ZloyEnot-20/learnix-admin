import jwt from "jsonwebtoken"
import { env } from "../config/env.js"

export function signAccessToken(user) {
  return jwt.sign({ role: user.role }, env.jwt.accessSecret, {
    subject: String(user._id),
    expiresIn: env.jwt.accessTtl,
  })
}

export function signRefreshToken(user) {
  return jwt.sign({ type: "refresh" }, env.jwt.refreshSecret, {
    subject: String(user._id),
    expiresIn: env.jwt.refreshTtl,
  })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret)
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret)
}
