import { Router } from "express"
import { authenticate, isPlatformStaff } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { updateConfigSchema } from "../validators/schemas.js"
import * as ctrl from "../controllers/config.controller.js"

const router = Router()

router.use(authenticate, isPlatformStaff)

router.get("/", ctrl.getConfig)
router.patch("/", validate(updateConfigSchema), ctrl.updateConfig)

export default router
