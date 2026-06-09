import { Router } from "express"
import { authenticate, isPlatformStaff } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import {
  idParamSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from "../validators/schemas.js"
import * as ctrl from "../controllers/announcement.controller.js"

const router = Router()

router.use(authenticate, isPlatformStaff)

router.get("/", ctrl.listAnnouncements)
router.post("/", validate(createAnnouncementSchema), ctrl.createAnnouncement)
router.patch("/:id", validate(updateAnnouncementSchema), ctrl.updateAnnouncement)
router.delete("/:id", validate(idParamSchema), ctrl.deleteAnnouncement)

export default router
