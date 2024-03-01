
import { Router } from "express";
import * as  couponController from "./coupon.controller.js";
import expressAsyncHandler from "express-async-handler";
import { auth } from "../../middlewares/auth.middleware.js";
import { endpointsRoles } from "./coupon.endpoints.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js"
import * as validators from  './coupon.validationSchemas.js';
const router = Router();


router.post('/', 
auth(endpointsRoles.ADD_COUPOUN), 
validationMiddleware(validators.addCouponSchema),
 expressAsyncHandler(couponController.addCoupon));

router.get('/', 
auth(endpointsRoles.ADD_COUPOUN), 
// validationMiddleware(validators.addCouponSchema),
 expressAsyncHandler(couponController.applyCoupon));
export default router;