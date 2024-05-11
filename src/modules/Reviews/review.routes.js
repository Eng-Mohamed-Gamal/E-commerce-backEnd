import { Router } from "express";
import * as RC from "./review.controller.js";
import expressAsyncHandler from "express-async-handler";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
import * as validator from "./review.validation.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

const router = Router();

router.post(
  "/:productId",
  auth([systemRoles.USER]),
  validationMiddleware(validator.addReviewSchema),
  expressAsyncHandler(RC.addReview)
);
router.delete(
  "/:productId",
  auth([systemRoles.USER]),
  validationMiddleware(validator.deleteReviewSchema),
  expressAsyncHandler(RC.deleteReview)
);
router.get(
  "/:productId",
  auth([systemRoles.USER]),
  validationMiddleware(validator.allProductReviewsSchema),
  expressAsyncHandler(RC.getReviewsForProduct)
);

export default router;
