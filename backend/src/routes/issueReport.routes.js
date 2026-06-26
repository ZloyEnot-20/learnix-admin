import { Router } from "express"
import { authenticate, isPlatformStaff } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { updateIssueReportSchema } from "../validators/schemas.js"
import * as ctrl from "../controllers/issueReport.controller.js"

const router = Router()

router.use(authenticate, isPlatformStaff)

router.get("/", ctrl.listIssueReports)
router.patch("/:id", validate(updateIssueReportSchema), ctrl.updateIssueReport)

export default router
