import mongoose from "mongoose"
import { uid } from "../utils/ids.js"

const platformPaymentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uid("ppay") },
    orgId: { type: String, ref: "Organization", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    periodLabel: { type: String, required: true },
    paidAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true, _id: false },
)

platformPaymentSchema.methods.toJSON = function toJSON() {
  const o = this.toObject()
  return {
    id: o._id,
    orgId: o.orgId,
    amount: o.amount,
    currency: o.currency,
    status: o.status,
    periodLabel: o.periodLabel,
    paidAt: o.paidAt ?? null,
    notes: o.notes ?? null,
    createdAt: o.createdAt,
  }
}

export const PlatformPayment = mongoose.model("PlatformPayment", platformPaymentSchema)
