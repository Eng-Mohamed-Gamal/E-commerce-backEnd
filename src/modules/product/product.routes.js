import { Router } from "express";
import expressAsyncHandler from "express-async-handler";

import * as Pc from "./product.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { multerMiddleHost } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import { systemRoles } from "../../utils/system-roles.js";
import * as validator from "./product.validation.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

const router = Router();

router.post(
  "/",
  auth([systemRoles.ADMIN, systemRoles.SUPER_ADMIN]),
  multerMiddleHost({ extensions: allowedExtensions.image }).array("image", 3),
  validationMiddleware(validator.addProductSchema),
  expressAsyncHandler(Pc.addProduct)
);

router.put(
  "/:productId",
  auth([systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
  multerMiddleHost({ extensions: allowedExtensions.image }).single("image"),
  validationMiddleware(validator.updateProductSchema),
  expressAsyncHandler(Pc.updateProduct)
);
router.delete(
  "/:productId",
  auth([systemRoles.SUPER_ADMIN, systemRoles.ADMIN]),
  validationMiddleware(validator.getSpecProductSchema),
  expressAsyncHandler(Pc.deleteProduct)
);

router.get(
  "/",
  validationMiddleware(validator.getAllProductsSchema),
  expressAsyncHandler(Pc.getProducts)
);
router.get(
  "/getProductById/:productId",
  validationMiddleware(validator.getSpecProductSchema),
  expressAsyncHandler(Pc.getProductById)
);
router.get(
  "/getProductsForTwoSpecificBrands",
  expressAsyncHandler(Pc.getProductsForTwoSpecificBrands)
);
router.get(
  "/searchOnProductWithAnyField",
  expressAsyncHandler(Pc.searchOnProductWithAnyField)
);

export default router;
