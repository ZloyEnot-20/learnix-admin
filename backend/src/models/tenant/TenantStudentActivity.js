import { Schema } from "mongoose"
import { getTenantConnection } from "../../config/tenantDb.js"

/** Read-only subset of learnix-backend StudentActivity model for DAU analytics. */
const tenantStudentActivitySchema = new Schema(
  {
    _id: { type: String, required: true },
    orgId: { type: String, index: true },
    studentId: { type: String, index: true },
    at: { type: Date, index: true },
  },
  { _id: false },
)

export function getTenantStudentActivityModel() {
  const conn = getTenantConnection()
  return (
    conn.models.TenantStudentActivity ??
    conn.model("TenantStudentActivity", tenantStudentActivitySchema, "studentactivities")
  )
}
