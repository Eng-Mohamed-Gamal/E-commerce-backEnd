import { Router } from "express";
const router = Router();

import * as orderController from "./order.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
import expressAsyncHandler from "express-async-handler";
import * as validator from "./order.validation.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

router.post(
  "/",
  auth([systemRoles.USER]),
  validationMiddleware(validator.createOrderSchema),
  expressAsyncHandler(orderController.createOrder)
);

router.post(
  "/cartToOrder",
  auth([systemRoles.USER]),
  validationMiddleware(validator.convertCartToOrderSchema),
  expressAsyncHandler(orderController.convertFromcartToOrder)
);

router.put(
  "/:orderId",
  auth([systemRoles.DELIEVER_ROLE]),
  validationMiddleware(validator.deliveryTakeOrderSchema),
  expressAsyncHandler(orderController.delieverOrder)
);

router.post(
  "/stripePay/:orderId",
  auth([systemRoles.USER]),
  validationMiddleware(validator.deliveryTakeOrderSchema),
  expressAsyncHandler(orderController.payWithStripe)
);

router.post(
  "/webhook",
  expressAsyncHandler(orderController.stripeWebhookLocal)
);

router.post(
  "/refund/:orderId",
  auth([systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
  validationMiddleware(validator.deliveryTakeOrderSchema),
  expressAsyncHandler(orderController.refundOrder)
);

router.post(
  "/cancelOrder/:orderId",
  auth([systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
  validationMiddleware(validator.deliveryTakeOrderSchema),
  expressAsyncHandler(orderController.cancelOrder)
);

export default router;
