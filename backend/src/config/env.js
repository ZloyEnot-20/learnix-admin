import dotenv from "dotenv"

dotenv.config()

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4100),
  corsOrigins: process.env.CORS_ORIGINS ?? "",
  /** Allow any Origin (CORS_DISABLED=true). Dev/debug only — insecure in production. */
  corsDisabled: process.env.CORS_DISABLED === "true",
  mongoUri: required("MONGODB_URI"),
  dbName: process.env.MONGODB_DB ?? "learnix_platform",
  tenantDbName: process.env.TENANT_MONGODB_DB ?? "ielts",
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL ?? "30d",
  },
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@learnix.platform",
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? "admin123",
    demoOwnerPassword: process.env.SEED_DEMO_OWNER_PASSWORD ?? "demo123",
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  },
}

export const isProd = env.nodeEnv === "production"
