import { connectTenantDB } from "../config/tenantDb.js"
import { getTenantUserModel } from "../models/tenant/TenantUser.js"
import { hashPassword } from "../utils/password.js"
import { uid } from "../utils/ids.js"

/**
 * Ensure the org owner can sign in to learnix-front (learnix-backend auth).
 * Platform owners live in learnix_platform; tenant admins live in the ielts DB.
 */
export async function provisionTenantAdmin({ orgId, login, email, name, plainPassword }) {
  await connectTenantDB()
  const TenantUser = getTenantUserModel()
  const normalizedLogin = login.trim().toLowerCase()
  const normalizedEmail = email.trim().toLowerCase()
  const passwordHash = await hashPassword(plainPassword)

  const existing = await TenantUser.findOne({
    orgId,
    $or: [{ login: normalizedLogin }, { email: normalizedEmail }],
  })

  if (existing) {
    existing.orgId = orgId
    existing.name = name.trim()
    existing.login = normalizedLogin
    existing.email = normalizedEmail
    existing.role = "admin"
    existing.passwordHash = passwordHash
    await existing.save()
    return { userId: existing._id, created: false }
  }

  const user = await TenantUser.create({
    _id: uid("user"),
    orgId,
    login: normalizedLogin,
    email: normalizedEmail,
    name: name.trim(),
    role: "admin",
    passwordHash,
    isPremium: true,
  })

  return { userId: user._id, created: true }
}
