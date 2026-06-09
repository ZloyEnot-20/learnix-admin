import { Router } from "express"
import { authenticate, isPlatformStaff } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import {
  idParamSchema,
  updateSubscriptionSchema,
  createPaymentSchema,
} from "../validators/schemas.js"
import * as ctrl from "../controllers/billing.controller.js"

const router = Router()

router.use(authenticate, isPlatformStaff)

router.get("/summary", ctrl.billingSummary)
router.get("/subscriptions", ctrl.listSubscriptions)
router.patch("/subscriptions/:id", validate(updateSubscriptionSchema), ctrl.updateSubscription)
router.get("/payments", ctrl.listPayments)
router.post("/payments", validate(createPaymentSchema), ctrl.createPayment)

export default router
