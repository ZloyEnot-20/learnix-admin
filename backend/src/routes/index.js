import { Router } from "express"
import { authLimiter } from "../middleware/rateLimit.js"
import { validate } from "../middleware/validate.js"
import { registerOrgSchema } from "../validators/schemas.js"
import * as orgCtrl from "../controllers/organization.controller.js"
import authRoutes from "./auth.routes.js"
import orgRoutes from "./organization.routes.js"
import userRoutes from "./user.routes.js"
import billingRoutes from "./billing.routes.js"
import auditRoutes from "./audit.routes.js"
import configRoutes from "./config.routes.js"
import dashboardRoutes from "./dashboard.routes.js"
import analyticsRoutes from "./analytics.routes.js"
import claimRoutes from "./claim.routes.js"
import announcementRoutes from "./announcement.routes.js"

const router = Router()

router.get("/health", (_req, res) => res.json({ ok: true, service: "learnix-platform-admin" }))

router.post("/register", authLimiter, validate(registerOrgSchema), orgCtrl.registerOrganization)

router.use("/auth", authRoutes)
router.use("/dashboard", dashboardRoutes)
router.use("/analytics", analyticsRoutes)
router.use("/organizations", orgRoutes)
router.use("/users", userRoutes)
router.use("/billing", billingRoutes)
router.use("/audit", auditRoutes)
router.use("/config", configRoutes)
router.use("/claims", claimRoutes)
router.use("/announcements", announcementRoutes)

export default router
