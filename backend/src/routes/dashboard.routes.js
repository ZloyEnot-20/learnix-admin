import { Router } from "express"
import { authenticate, isPlatformStaff } from "../middleware/auth.js"
import * as ctrl from "../controllers/dashboard.controller.js"

const router = Router()

router.use(authenticate, isPlatformStaff)
router.get("/", ctrl.dashboard)

export default router
