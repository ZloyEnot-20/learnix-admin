import { PlatformConfig } from "../models/PlatformConfig.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { recordAudit } from "../services/audit.service.js"

async function ensureConfig() {
  let cfg = await PlatformConfig.findById("platform")
  if (!cfg) cfg = await PlatformConfig.create({ _id: "platform" })
  return cfg
}

export const getConfig = asyncHandler(async (_req, res) => {
  const cfg = await ensureConfig()
  res.json(cfg.toJSON())
})

export const updateConfig = asyncHandler(async (req, res) => {
  const cfg = await ensureConfig()
  const { defaultLimits, trialDays, featureFlags } = req.body

  if (defaultLimits) cfg.defaultLimits = defaultLimits
  if (trialDays !== undefined) cfg.trialDays = trialDays
  if (featureFlags) {
    for (const [key, value] of Object.entries(featureFlags)) {
      cfg.featureFlags.set(key, value)
    }
  }
  await cfg.save()

  await recordAudit({
    req,
    action: "update",
    category: "config",
    targetType: "platform_config",
    targetId: "platform",
    targetLabel: "Platform configuration",
    details: { patch: req.body },
  })

  res.json(cfg.toJSON())
})
