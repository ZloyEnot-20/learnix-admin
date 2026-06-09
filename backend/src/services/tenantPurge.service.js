import { connectTenantDB } from "../config/tenantDb.js"
import { getTenantConnection } from "../config/tenantDb.js"

const TENANT_COLLECTIONS = [
  "users",
  "groups",
  "homeworks",
  "submissions",
  "controlworks",
  "controlworksubmissions",
  "payments",
  "entrytests",
  "notifications",
  "studentactivities",
  "exerciseevents",
  "testresults",
  "parentlinks",
  "studentclaims",
  "botinvites",
  "auditlogs",
]

/**
 * Remove all tenant-scoped data for an organization from the shared Learnix DB.
 * Shared exercise content catalogue is preserved.
 */
export async function purgeTenantData(orgId) {
  if (!orgId) return

  await connectTenantDB()
  const conn = getTenantConnection()

  await Promise.all(
    TENANT_COLLECTIONS.map((name) => conn.collection(name).deleteMany({ orgId })),
  )
}
