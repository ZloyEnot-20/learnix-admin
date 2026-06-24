/** Shared MongoDB driver options. */
export const MONGO_DRIVER_OPTS = {
  serverSelectionTimeoutMS: 10_000,
  family: 4,
}

export function maskMongoUri(uri) {
  try {
    const u = new URL(String(uri).replace(/^mongodb(\+srv)?:\/\//, "http://"))
    return {
      scheme: String(uri).startsWith("mongodb+srv") ? "mongodb+srv" : "mongodb",
      user: u.username || "(none)",
      passwordLength: u.password?.length ?? 0,
      host: u.hostname || "(missing)",
      uriPathDb: u.pathname.replace(/^\//, "") || "(none — dbName option applies)",
      queryParams: u.search ? u.search.slice(1) : "(none)",
      hasPassword: Boolean(u.password),
    }
  } catch {
    return { error: "URI parse failed — check quotes/special chars in .env" }
  }
}

export function buildMongoConnectOptions(dbName) {
  return { ...MONGO_DRIVER_OPTS, dbName }
}

export function logMongoConnectDebug(label, { mongoUri, dbName, tenantDbName }) {
  console.log(`[db] ${label} connect config:`)
  if (tenantDbName !== undefined) {
    console.log("[db]   tenantDbName:", JSON.stringify(tenantDbName))
  }
}

const ATLAS_GENERIC_RE =
  /could not connect to any servers in your mongodb atlas cluster/i

export function collectMongoErrorMessages(err) {
  const messages = []
  const visited = new WeakSet()

  function visit(error) {
    if (!error || typeof error !== "object" || visited.has(error)) return
    visited.add(error)
    if (typeof error.message === "string" && error.message.trim()) messages.push(error.message.trim())
    if (error.cause) visit(error.cause)
    const servers = error.reason?.servers
    if (servers instanceof Map) {
      for (const desc of servers.values()) {
        if (desc?.error) visit(desc.error)
      }
    }
  }

  visit(err)
  return [...new Set(messages)]
}

export function classifyMongoConnectError(messages) {
  const text = messages.join(" ").toLowerCase()
  if (/\bbad auth\b|authentication failed/.test(text)) return "auth"
  if (/enotfound|querysrv/.test(text)) return "dns"
  if (/whitelist|could not connect|timed out|econnrefused/.test(text)) return "network"
  return "unknown"
}

export function mongoRootCauses(messages) {
  return messages.filter((m) => !ATLAS_GENERIC_RE.test(m))
}

export function logMongoConnectSuccess(label, dbName) {
  console.log(`[db] ${label} connected (db: ${dbName})`)
}

export async function logMongoConnectError(label, err) {
  const messages = collectMongoErrorMessages(err)
  const kind = classifyMongoConnectError(messages)
  const roots = mongoRootCauses(messages)

  console.error(`[db] ${label} connect failed [${kind}]:`)
  console.error(err)
  if (roots.length) {
    console.error("[db] root cause(s):")
    for (const line of roots) console.error("  •", line)
  }
  if (err?.stack) console.error(err.stack)

  if (kind === "auth") {
    console.error("[db] → Authentication failed — check MONGODB_URI password.")
  }
  if (kind === "dns") {
    console.error(
      "[db] → DNS lookup failed (often querySrv ETIMEOUT on Windows/VPN).",
    )
    console.error(
      "[db] → In MongoDB Atlas: Connect → Drivers → use “Standard connection string” (mongodb://… not mongodb+srv://…).",
    )
  }
}
