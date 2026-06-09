import { connectTenantDB } from "../config/tenantDb.js"
import { getTenantConnection } from "../config/tenantDb.js"

const TENANT_COLLECTIONS = [
  "users",
  "groups",
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
 * Shared homework catalogue and exercise content are preserved.
 */
export async function purgeTenantData(orgId) {
  if (!orgId) return

  await connectTenantDB()
  const conn = getTenantConnection()

  const groupIds = await conn
    .collection("groups")
    .find({ orgId })
    .project({ _id: 1 })
    .toArray()
    .then((rows) => rows.map((g) => g._id))

  if (groupIds.length) {
    await conn.collection("homeworks").deleteMany({ groupId: { $in: groupIds } })
  }

  await Promise.all(
    TENANT_COLLECTIONS.map((name) => conn.collection(name).deleteMany({ orgId })),
  )
}
