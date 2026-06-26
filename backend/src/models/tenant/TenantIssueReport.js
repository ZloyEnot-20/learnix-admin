import { Schema } from "mongoose"
import { getTenantConnection } from "../../config/tenantDb.js"

/** Read/write mirror of learnix-backend IssueReport (collection: issuereports). */
const tenantIssueReportSchema = new Schema(
  {
    _id: { type: String, required: true },
    orgId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    homeworkId: { type: String, index: true, default: null },
    controlWorkId: { type: String, index: true, default: null },
    stepIndex: { type: Number, default: null },
    exerciseSlug: { type: String, required: true, index: true },
    exerciseTitle: { type: String, required: true },
    exerciseKind: {
      type: String,
      enum: ["grammar", "vocabulary", "podcast", "speaking"],
      required: true,
    },
    questionIndex: { type: Number, default: null },
    questionId: { type: Number, default: null },
    questionPrompt: { type: String, default: null },
    message: { type: String, maxlength: 50, default: null },
    status: {
      type: String,
      enum: ["open", "resolved", "dismissed"],
      default: "open",
      index: true,
    },
    resolvedAt: { type: Date, default: null },
    resolvedById: { type: String, default: null },
    resolvedByName: { type: String, default: null },
  },
  { timestamps: true, _id: false },
)

export function getTenantIssueReportModel() {
  const conn = getTenantConnection()
  return (
    conn.models.TenantIssueReport ??
    conn.model("TenantIssueReport", tenantIssueReportSchema, "issuereports")
  )
}
