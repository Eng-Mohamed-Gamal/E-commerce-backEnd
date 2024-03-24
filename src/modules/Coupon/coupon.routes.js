import { Router } from "express";
import * as couponController from "./coupon.controller.js";
import expressAsyncHandler from "express-async-handler";
import { auth } from "../../middlewares/auth.middleware.js";
import { endpointsRoles } from "./coupon.endpoints.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import * as validators from "./coupon.validationSchemas.js";
const router = Router();

router.post(
  "/",
  auth(endpointsRoles.ADD_COUPOUN),
  validationMiddleware(validators.addCouponSchema),
  expressAsyncHandler(couponController.addCoupon)
);

router.post(
  "/disableEnableCoupon",
  auth(endpointsRoles.ADD_COUPOUN),
  validationMiddleware(validators.disableEnableCouponSchema),
  expressAsyncHandler(couponController.disableEnableCoupon)
);

router.get(
  "/",
  auth(endpointsRoles.ADD_COUPOUN),
  validationMiddleware(validators.applyCouponSchema),
  expressAsyncHandler(couponController.applyCoupon)
);

router.get(
  "/getCouponsByStatus",
  auth(endpointsRoles.ADD_COUPOUN),
  validationMiddleware(validators.getCouponsByStatusSchema),
  expressAsyncHandler(couponController.getCouponsByStatus)
);
router.get(
  "/getCouponById",
  auth(endpointsRoles.ADD_COUPOUN),
  validationMiddleware(validators.getCouponByIdSChema),
  expressAsyncHandler(couponController.getCouponById)
);
router.put(
  "/",
  auth(endpointsRoles.ADD_COUPOUN),
  validationMiddleware(validators.updateCouponSchema),
  expressAsyncHandler(couponController.updateCoupon)
);
export default router;
