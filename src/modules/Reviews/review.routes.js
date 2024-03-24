import { Router } from "express";
import * as RC from "./review.controller.js"
import expressAsyncHandler from "express-async-handler";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";


const router = Router()



router.post("/" , auth([systemRoles.USER])  ,expressAsyncHandler(RC.addReview))
router.delete("/" , auth([systemRoles.USER])  ,expressAsyncHandler(RC.deleteReview))
router.get("/" , auth([systemRoles.USER])  ,expressAsyncHandler(RC.getReviewsForProduct))



export default router