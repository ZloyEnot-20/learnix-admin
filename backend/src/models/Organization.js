import mongoose from "mongoose"
import { uid } from "../utils/ids.js"

const organizationSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uid("org") },
    name: { type: String, required: true, trim: true },
    subdomain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ["active", "blocked"], default: "active", index: true },
    plan: { type: String, enum: ["free", "pro"], default: "free", index: true },
    limits: {
      maxStudents: { type: Number, default: 50, min: 0 },
      maxTeachers: { type: Number, default: 5, min: 0 },
    },
    trialEndsAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true, _id: false },
)

organizationSchema.methods.toJSON = function toJSON() {
  const o = this.toObject()
  return {
    id: o._id,
    name: o.name,
    subdomain: o.subdomain,
    status: o.status,
    plan: o.plan,
    limits: o.limits,
    trialEndsAt: o.trialEndsAt ?? null,
    notes: o.notes ?? null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

export const Organization = mongoose.model("Organization", organizationSchema)
