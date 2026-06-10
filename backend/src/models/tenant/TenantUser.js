import { Schema } from "mongoose"
import { getTenantConnection } from "../../config/tenantDb.js"

/** Same physical `users` collection as learnix-backend User model — read/write subset for admin provisioning. */
const tenantUserSchema = new Schema(
  {
    _id: { type: String, required: true },
    orgId: { type: String, index: true, default: null },
    login: { type: String, lowercase: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["super_admin", "admin", "teacher", "student"],
      required: true,
    },
    passwordHash: { type: String, required: true, select: false },
    isPremium: { type: Boolean, default: false },
  },
  { timestamps: true, _id: false },
)

tenantUserSchema.index({ orgId: 1, login: 1 }, { unique: true, sparse: true })
tenantUserSchema.index({ orgId: 1, email: 1 }, { unique: true, sparse: true })

export function getTenantUserModel() {
  const conn = getTenantConnection()
  return conn.models.TenantUser ?? conn.model("TenantUser", tenantUserSchema, "users")
}
