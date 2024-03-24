import { Router } from "express";
import * as Bc from "./brand.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
import { multerMiddleHost } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import expressAsyncHandler from "express-async-handler";
const router = Router();

router.post(
  "/",
  auth([systemRoles.ADMIN]),
  multerMiddleHost({ extensions: allowedExtensions.image }).single("image"),
  expressAsyncHandler(Bc.addBrand)
);
router.put(
  "/:brandId",
  auth([systemRoles.ADMIN]),
  multerMiddleHost({ extensions: allowedExtensions.image }).single("image"),
  expressAsyncHandler(Bc.updateBrand)
);

router.get( "/" , auth([systemRoles.SUPER_ADMIN]) , expressAsyncHandler( Bc.getAllBrands)) 
router.get( "/getAllBrandsForCategory" , auth([systemRoles.SUPER_ADMIN]) , expressAsyncHandler( Bc.getAllBrandsForCategory)) 
router.get( "/getAllBrandsForSubCategory" , auth([systemRoles.SUPER_ADMIN]) , expressAsyncHandler( Bc.getAllBrandsForSubCategory)) 

router.delete( "/" , auth([systemRoles.ADMIN]) , expressAsyncHandler( Bc.deletebrand)) 

export default router;

