import { Router } from "express";
const router = Router();
import * as subCategoryController from "./subCategory.controller.js";
import expressAsyncHandler from "express-async-handler";
import { multerMiddleHost } from "../../middlewares/multer.js";
import { endPointsRoles } from "../Category/category.endpoints.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import * as validator from "./sub-category.validation.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

router.post(
  "/:categoryId",
  auth(endPointsRoles.ADD_CATEGORY),
  multerMiddleHost({
    extensions: allowedExtensions.image,
  }).single("image"),
  validationMiddleware(validator.addSubCategorySchema),
  expressAsyncHandler(subCategoryController.addSubCategory)
);

router.put(
  "/:subCategoryId",
  auth(endPointsRoles.ADD_CATEGORY),
  multerMiddleHost({
    extensions: allowedExtensions.image,
  }).single("image"),
  validationMiddleware(validator.updateSubCategorySchema),
  expressAsyncHandler(subCategoryController.updateSubCategory)
);

router.get(
  "/getAllSubCategoriesWithBrand",
  auth(endPointsRoles.ADD_CATEGORY),
  expressAsyncHandler(subCategoryController.getAllSubCategoriesWithBrand)
);
router.get(
  "/getAllSubCategoriesForCategory/:categoryId",
  auth(endPointsRoles.ADD_CATEGORY),
  validationMiddleware(validator.getAllSubCategoriesForCategory),
  expressAsyncHandler(subCategoryController.getAllSubCategoriesForCategory)
);
router.get(
  "/getSubCategoryById/:subCategoryId",
  auth(endPointsRoles.ADD_CATEGORY),
  validationMiddleware(validator.getSubCategoryByIdSchema),
  expressAsyncHandler(subCategoryController.getSubCategoryBId)
);
router.delete(
  "/:subCategoryId",
  auth(endPointsRoles.ADD_CATEGORY),
  validationMiddleware(validator.deleteSubCategorySchema),
  expressAsyncHandler(subCategoryController.deleteSubCategory)
);

export default router;
