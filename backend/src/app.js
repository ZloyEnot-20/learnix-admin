import "./config/mongoose.js"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import cookieParser from "cookie-parser"
import { env, isProd } from "./config/env.js"
import { resolveCorsOptions } from "./utils/cors.js"
import { apiLimiter } from "./middleware/rateLimit.js"
import { notFound, errorHandler } from "./middleware/error.js"
import routes from "./routes/index.js"

export function createApp() {
  const app = express()

  app.disable("x-powered-by")
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))
  app.use(cors(resolveCorsOptions({ corsDisabled: env.corsDisabled, corsOriginsRaw: env.corsOrigins })))
  app.use(express.json({ limit: "1mb" }))
  app.use(cookieParser())
  app.use(morgan(isProd ? "combined" : "dev"))
  app.use("/api", apiLimiter, routes)
  app.use(notFound)
  app.use(errorHandler)

  return app
}
