import { Router } from "express"
import { authLimiter } from "../middleware/rateLimit.js"
import { validate } from "../middleware/validate.js"
import { authenticate, isPlatformStaff } from "../middleware/auth.js"
import { loginSchema, refreshSchema } from "../validators/schemas.js"
import * as ctrl from "../controllers/auth.controller.js"

const router = Router()

router.post("/login", authLimiter, validate(loginSchema), ctrl.login)
router.post("/refresh", authLimiter, validate(refreshSchema), ctrl.refresh)
router.get("/me", authenticate, isPlatformStaff, ctrl.me)

export default router
