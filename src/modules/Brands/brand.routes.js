import { Router } from "express";
import * as Bc from "./brand.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
import { multerMiddleHost } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import * as validator from "./brand.validation.js";
import expressAsyncHandler from "express-async-handler";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
const router = Router();

router.post(
  "/",
  auth([systemRoles.ADMIN]),
  multerMiddleHost({ extensions: allowedExtensions.image }).single("image"),
  validationMiddleware(validator.addBrandSchema),
  expressAsyncHandler(Bc.addBrand)
);
router.put(
  "/:brandId",
  auth([systemRoles.ADMIN]),
  multerMiddleHost({ extensions: allowedExtensions.image }).single("image"),
  validationMiddleware(validator.updateBrandSchema),
  expressAsyncHandler(Bc.updateBrand)
);

router.get(
  "/",
  auth([systemRoles.SUPER_ADMIN]),
  expressAsyncHandler(Bc.getAllBrands)
);
router.get(
  "/getAllBrandsForCategory",
  auth([systemRoles.SUPER_ADMIN]),
  expressAsyncHandler(Bc.getAllBrandsForCategory)
);
router.get(
  "/getAllBrandsForSubCategory",
  auth([systemRoles.SUPER_ADMIN]),
  expressAsyncHandler(Bc.getAllBrandsForSubCategory)
);

router.delete(
  "/:brandId",
  auth([systemRoles.ADMIN]),
  validationMiddleware(validator.deleteBrandSchema),
  expressAsyncHandler(Bc.deletebrand)
);

router.get(
  "/getBrandsWithProducts",
  auth([systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
  validationMiddleware(validator.getBrandSeparatelySchema),
  expressAsyncHandler(Bc.getBrandWithProducts)
);

export default router;
