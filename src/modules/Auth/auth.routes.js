import { Router } from "express";
import * as authController from "./auth.controller.js";
import expressAsyncHandler from "express-async-handler";
import * as validator from "./auth.validation.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import * as validator from "./auth.validation.js"
const router = Router();

router.post(
  "/",
  validationMiddleware(validator.signUpSchema),
  expressAsyncHandler(authController.signUp)
);

router.post(
  "/login",
  validationMiddleware(validator.loginSchema),
  expressAsyncHandler(authController.singIn)
);

router.get(
  "/verify-email",
  validationMiddleware(validator.verifyEmail),
  expressAsyncHandler(authController.verifyEmail)
);
router.patch(
  "/log-out/:userId",
  auth([
    systemRoles.USER,
    systemRoles.SELLER,
    systemRoles.SUPERADMIN,
    systemRoles.DELIVERY,
  ]),
  validationMiddleware(validator.logOut),
  expressAsyncHandler(authController.logout)
);

router.patch(
  "/:userId",
  auth([
    systemRoles.USER,
    systemRoles.SELLER,
    systemRoles.SUPERADMIN,
    systemRoles.DELIVERY,
  ]),
  validationMiddleware(validator.updatePassword),
  expressAsyncHandler(authController.updatePassword)
);

router.put(
  "/forget",
  validationMiddleware(validator.forgetPassword),
  expressAsyncHandler(authController.forgetPassword)
);

router.put(
  "/reset/:token",
  validationMiddleware(validator.resetPassword),
  expressAsyncHandler(authController.resetPassword)
);

export default router;
