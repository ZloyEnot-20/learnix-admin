import { createApp } from "./app.js"
import { env } from "./config/env.js"
import { validateSecurityConfig } from "./config/securityCheck.js"

validateSecurityConfig()

const app = createApp()
app.listen(env.port, () => {
  console.log(`[platform-admin-api] http://localhost:${env.port}/api`)
})
