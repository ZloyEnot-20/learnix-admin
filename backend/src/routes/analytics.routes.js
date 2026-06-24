import { Router } from "express"
import { authenticate, isPlatformStaff } from "../middleware/auth.js"
import * as ctrl from "../controllers/analytics.controller.js"

const router = Router()

router.use(authenticate, isPlatformStaff)
router.get("/platform", ctrl.platformAnalytics)

export default router
