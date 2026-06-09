import mongoose from "mongoose"
import { env } from "./env.js"

mongoose.set("strictQuery", true)

await mongoose.connect(env.mongoUri, { dbName: env.dbName })
console.log(`[db] connected to ${env.dbName}`)
