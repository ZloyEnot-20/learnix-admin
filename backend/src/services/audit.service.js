function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"]
  if (typeof fwd === "string") return fwd.split(",")[0].trim()
  return req.socket?.remoteAddress ?? null
}

export async function recordAudit({
  req,
  actor,
  action,
  category,
  targetType,
  targetId,
  targetLabel,
  orgId,
  details,
}) {
  try {
    const { PlatformAuditLog } = await import("../models/PlatformAuditLog.js")
    const a = actor ?? req?.user
    await PlatformAuditLog.create({
      action,
      category,
      actorId: a?.id ?? null,
      actorName: a?.name ?? "System",
      actorRole: a?.role ?? null,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      targetLabel: targetLabel ?? null,
      orgId: orgId ?? null,
      details: details ?? null,
      ipAddress: req ? clientIp(req) : null,
      userAgent: req?.headers?.["user-agent"] ?? null,
    })
  } catch (err) {
    console.error("[audit]", err)
  }
}
