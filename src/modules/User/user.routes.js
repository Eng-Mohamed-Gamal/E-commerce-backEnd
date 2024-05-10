import { Router } from "express";
import * as uc from "./user.controller.js";
import expressAsyncHandler from "express-async-handler";
import { systemRoles } from "../../utils/system-roles.js";
import { auth } from "../../middlewares/auth.middleware.js";
const router = Router();
import * as validator from "./user.validation.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

router.put(
  "/",
  auth([systemRoles.USER, systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
  validationMiddleware(validator.updateProfile),
  expressAsyncHandler(uc.updateUser)
);

router.delete(
  "/",
  auth([systemRoles.USER, systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
  expressAsyncHandler(uc.deleteUser)
);

router.get(
  "/",
  auth([systemRoles.USER, systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
  expressAsyncHandler(uc.getUser)
);

export default router;
