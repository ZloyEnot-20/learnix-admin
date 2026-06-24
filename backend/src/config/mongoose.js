import mongoose from "mongoose"
import { env } from "./env.js"
import {
  buildMongoConnectOptions,
  logMongoConnectDebug,
  logMongoConnectError,
  logMongoConnectSuccess,
} from "./mongoOptions.js"

mongoose.set("strictQuery", true)

try {
  logMongoConnectDebug("main", {
    mongoUri: env.mongoUri,
    dbName: env.dbName,
    tenantDbName: env.tenantDbName,
  })
  await mongoose.connect(env.mongoUri, buildMongoConnectOptions(env.dbName))
  logMongoConnectSuccess("main", env.dbName)
} catch (err) {
  await logMongoConnectError("main", err)
  throw err
}
