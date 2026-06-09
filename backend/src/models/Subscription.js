import mongoose from "mongoose"
import { uid } from "../utils/ids.js"

const subscriptionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uid("sub") },
    orgId: { type: String, ref: "Organization", required: true, index: true },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    status: {
      type: String,
      enum: ["trialing", "active", "past_due", "canceled"],
      default: "trialing",
      index: true,
    },
    trialEndsAt: { type: Date },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    canceledAt: { type: Date },
  },
  { timestamps: true, _id: false },
)

subscriptionSchema.methods.toJSON = function toJSON() {
  const o = this.toObject()
  return {
    id: o._id,
    orgId: o.orgId,
    plan: o.plan,
    status: o.status,
    trialEndsAt: o.trialEndsAt ?? null,
    currentPeriodStart: o.currentPeriodStart ?? null,
    currentPeriodEnd: o.currentPeriodEnd ?? null,
    canceledAt: o.canceledAt ?? null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

export const Subscription = mongoose.model("Subscription", subscriptionSchema)
