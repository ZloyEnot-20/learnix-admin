import { connectTenantDB } from "../config/tenantDb.js"
import { getTenantUserModel } from "../models/tenant/TenantUser.js"

export async function getTenantUsage(orgId) {
  await connectTenantDB()
  const TenantUser = getTenantUserModel()
  const [studentCount, teacherCount, adminCount] = await Promise.all([
    TenantUser.countDocuments({ orgId, type: "student" }),
    TenantUser.countDocuments({ orgId, type: "teacher" }),
    TenantUser.countDocuments({ orgId, type: { $in: ["admin", "super_admin"] } }),
  ])
  return {
    studentCount,
    teacherCount,
    adminCount,
    totalUsers: studentCount + teacherCount + adminCount,
  }
}
