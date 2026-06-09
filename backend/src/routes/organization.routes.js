import { Router } from "express"
import { authenticate, isPlatformStaff } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import {
  idParamSchema,
  createOrgSchema,
  updateOrgSchema,
} from "../validators/schemas.js"
import * as ctrl from "../controllers/organization.controller.js"

const router = Router()

router.use(authenticate, isPlatformStaff)

router.get("/stats", ctrl.orgStats)
router.get("/", ctrl.listOrganizations)
router.get("/:id", validate(idParamSchema), ctrl.getOrganization)
router.post("/", validate(createOrgSchema), ctrl.createOrganization)
router.post("/:id/reset-owner-access", validate(idParamSchema), ctrl.resetOwnerAccess)
router.patch("/:id", validate(updateOrgSchema), ctrl.updateOrganization)
router.delete("/:id", validate(idParamSchema), ctrl.deleteOrganization)

export default router
