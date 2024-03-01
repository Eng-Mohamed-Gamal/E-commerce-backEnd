import { Router } from "express";
import * as Cc from "./cart.controller.js"
import expressAsyncHandler from "express-async-handler";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";

const router = Router()







router.post("/" , auth([systemRoles.USER])  , expressAsyncHandler(Cc.addToCart))
router.put("/" , auth([systemRoles.USER])  , expressAsyncHandler(Cc.removeFromcart))












export default router ;