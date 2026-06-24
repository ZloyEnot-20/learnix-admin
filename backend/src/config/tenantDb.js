import mongoose from "mongoose"
import { env } from "./env.js"
import { buildMongoConnectOptions, logMongoConnectDebug } from "./mongoOptions.js"

let tenantConn = null

/** Connection to the per-tenant Learnix app database (learnix-front / learnix-backend). */
export async function connectTenantDB() {
  if (tenantConn) return tenantConn
  logMongoConnectDebug("tenant", {
    mongoUri: env.mongoUri,
    dbName: env.tenantDbName,
  })
  tenantConn = mongoose.createConnection(
    env.mongoUri,
    buildMongoConnectOptions(env.tenantDbName),
  )
  await tenantConn.asPromise()
  console.log(`[db] connected to tenant MongoDB (db: ${tenantConn.name})`)
  return tenantConn
}

export function getTenantConnection() {
  if (!tenantConn) {
    throw new Error("Tenant DB not connected — call connectTenantDB() first")
  }
  return tenantConn
}
