import mongoose from "mongoose"
import { env } from "./env.js"

let tenantConn = null

/** Connection to the per-tenant Learnix app database (learnix-front / learnix-backend). */
export async function connectTenantDB() {
  if (tenantConn) return tenantConn
  tenantConn = mongoose.createConnection(env.mongoUri, {
    serverSelectionTimeoutMS: 10_000,
    dbName: env.tenantDbName,
  })
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
