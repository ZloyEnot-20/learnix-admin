import { Router } from "express"
import { authenticate, isPlatformStaff } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { idParamSchema, createUserSchema, updateUserSchema } from "../validators/schemas.js"
import * as ctrl from "../controllers/user.controller.js"

const router = Router()

router.use(authenticate, isPlatformStaff)

router.get("/", ctrl.listUsers)
router.post("/", validate(createUserSchema), ctrl.createUser)
router.patch("/:id", validate(updateUserSchema), ctrl.updateUser)
router.delete("/:id", validate(idParamSchema), ctrl.deleteUser)

export default router
