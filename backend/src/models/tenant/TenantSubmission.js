import { Schema } from "mongoose"
import { getTenantConnection } from "../../config/tenantDb.js"

/** Read-only subset of learnix-backend Submission model for platform analytics. */
const tenantSubmissionSchema = new Schema(
  {
    _id: { type: String, required: true },
    orgId: { type: String, index: true },
    studentId: { type: String, index: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "paused", "submitted", "graded"],
    },
    submittedAt: { type: Date, index: true },
  },
  { _id: false },
)

export function getTenantSubmissionModel() {
  const conn = getTenantConnection()
  return (
    conn.models.TenantSubmission ??
    conn.model("TenantSubmission", tenantSubmissionSchema, "submissions")
  )
}
