import mongoose from "mongoose"

/** Global platform config: default limits + feature flags. */
const platformConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "platform" },
    defaultLimits: {
      free: {
        maxStudents: { type: Number, default: 50 },
        maxTeachers: { type: Number, default: 5 },
      },
      pro: {
        maxStudents: { type: Number, default: 500 },
        maxTeachers: { type: Number, default: 50 },
      },
    },
    trialDays: { type: Number, default: 14 },
    featureFlags: {
      type: Map,
      of: Boolean,
      default: () =>
        new Map([
          ["vocabulary", true],
          ["control_works", true],
          ["telegram_bot", true],
          ["mobile_app", true],
          ["billing", true],
        ]),
    },
  },
  { timestamps: true, _id: false },
)

platformConfigSchema.methods.toJSON = function toJSON() {
  const o = this.toObject()
  const flags = {}
  if (o.featureFlags instanceof Map) {
    for (const [k, v] of o.featureFlags) flags[k] = v
  } else if (o.featureFlags) {
    Object.assign(flags, o.featureFlags)
  }
  return {
    id: o._id,
    defaultLimits: o.defaultLimits,
    trialDays: o.trialDays,
    featureFlags: flags,
    updatedAt: o.updatedAt,
  }
}

export const PlatformConfig = mongoose.model("PlatformConfig", platformConfigSchema)
