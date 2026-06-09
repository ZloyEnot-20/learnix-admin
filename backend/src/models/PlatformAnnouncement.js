import mongoose from "mongoose"
import { uid } from "../utils/ids.js"

const platformAnnouncementSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uid("ann") },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ["news", "maintenance"], default: "news" },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "info" },
    /** null or empty = broadcast to all organizations */
    targetOrgIds: { type: [String], default: null },
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },
  },
  { timestamps: true, _id: false },
)

platformAnnouncementSchema.methods.toJSON = function toJSON() {
  const o = this.toObject()
  return {
    id: o._id,
    title: o.title,
    message: o.message,
    type: o.type,
    severity: o.severity,
    targetOrgIds: o.targetOrgIds ?? null,
    startsAt: o.startsAt,
    endsAt: o.endsAt ?? null,
    isActive: o.isActive,
    createdBy: o.createdBy ?? null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

export const PlatformAnnouncement = mongoose.model(
  "PlatformAnnouncement",
  platformAnnouncementSchema,
)
