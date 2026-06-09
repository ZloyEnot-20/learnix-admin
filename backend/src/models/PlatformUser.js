import mongoose from "mongoose"
import { uid } from "../utils/ids.js"

/** Platform operators + org-linked users (owners/admins). */
const platformUserSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uid("puser") },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    /** Login for org owners (used in tenant apps). */
    login: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    /** super_admin | platform_admin — platform staff; owner | org_admin — tenant users */
    role: {
      type: String,
      enum: ["super_admin", "platform_admin", "owner", "org_admin"],
      required: true,
      index: true,
    },
    /** Set for owner/org_admin; null for platform staff */
    orgId: { type: String, ref: "Organization", index: true, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
)

platformUserSchema.methods.toSafeJSON = function toSafeJSON() {
  const o = this.toObject()
  return {
    id: o._id,
    email: o.email,
    login: o.login ?? null,
    name: o.name,
    role: o.role,
    orgId: o.orgId ?? null,
    isActive: o.isActive,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

export const PlatformUser = mongoose.model("PlatformUser", platformUserSchema)
