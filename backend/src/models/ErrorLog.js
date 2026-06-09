import mongoose from "mongoose"
import { uid } from "../utils/ids.js"

const errorLogSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uid("err") },
    level: { type: String, enum: ["error", "warn", "info"], default: "error", index: true },
    message: { type: String, required: true },
    stack: { type: String },
    orgId: { type: String, index: true },
    source: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false }, _id: false },
)

errorLogSchema.methods.toJSON = function toJSON() {
  const o = this.toObject()
  return {
    id: o._id,
    level: o.level,
    message: o.message,
    stack: o.stack ?? null,
    orgId: o.orgId ?? null,
    source: o.source ?? null,
    details: o.details ?? null,
    createdAt: o.createdAt,
  }
}

export const ErrorLog = mongoose.model("ErrorLog", errorLogSchema)
