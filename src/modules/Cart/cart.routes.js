import { Router } from "express";
import * as Cc from "./cart.controller.js";
import expressAsyncHandler from "express-async-handler";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";

const router = Router();

router.get("/", auth([systemRoles.USER]), expressAsyncHandler(Cc.getCart));
router.post("/", auth([systemRoles.USER]), expressAsyncHandler(Cc.addToCart));
router.put(
  "/:productId",
  auth([systemRoles.USER]),
  expressAsyncHandler(Cc.removeFromcart)
);

export default router;
