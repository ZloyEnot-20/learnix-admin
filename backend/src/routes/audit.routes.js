import { Router } from "express"
import { authenticate, isPlatformStaff } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { auditQuerySchema, errorLogQuerySchema } from "../validators/schemas.js"
import * as ctrl from "../controllers/audit.controller.js"

const router = Router()

router.use(authenticate, isPlatformStaff)

router.get("/", validate(auditQuerySchema), ctrl.listAuditLogs)
router.get("/errors", validate(errorLogQuerySchema), ctrl.listErrorLogs)

export default router
