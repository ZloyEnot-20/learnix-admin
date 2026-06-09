import mongoose from "mongoose"
import { uid } from "../utils/ids.js"

const auditLogSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uid("audit") },
    action: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    actorId: { type: String, index: true },
    actorName: { type: String, required: true },
    actorRole: { type: String },
    targetType: { type: String },
    targetId: { type: String, index: true },
    targetLabel: { type: String },
    orgId: { type: String, index: true },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, _id: false },
)

export const PlatformAuditLog = mongoose.model("PlatformAuditLog", auditLogSchema)
