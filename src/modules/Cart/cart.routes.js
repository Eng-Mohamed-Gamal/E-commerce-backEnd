import { Router } from "express";
import * as Cc from "./cart.controller.js";
import expressAsyncHandler from "express-async-handler";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import * as validator from "./cart.validation.js";

const router = Router();

router.get("/", auth([systemRoles.USER]), expressAsyncHandler(Cc.getCart));
router.post(
  "/",
  validationMiddleware(validator.addProductToCartSchema),
  auth([systemRoles.USER]),
  expressAsyncHandler(Cc.addToCart)
);
router.put(
  "/:productId",
  auth([systemRoles.USER]),
  validationMiddleware(validator.removeProductFromCartSchema),
  expressAsyncHandler(Cc.removeFromcart)
);

export default router;
