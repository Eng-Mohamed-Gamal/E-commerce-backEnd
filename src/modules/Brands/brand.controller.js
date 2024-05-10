import slugify from "slugify";

import brandModel from "../../../DB/Models/brand.model.js";
import subCategoryModel from "../../../DB/Models/sub-category.model.js";
import cloudinaryConnection from "../../utils/cloudinary.js";
import generateUniqueString from "../../utils/generate-Unique-String.js";
import { APIFeatures } from "../../utils/api-features.js";

// ============================= addBrand ========================== //

export const addBrand = async (req, res, next) => {
  // disturcture data from request
  const { name } = req.body;
  const { categoryId, subCategoryId } = req.query;
  const { _id } = req.authUser;
  // subCategory Check
  const isSubcategoryExist = await subCategoryModel
    .findById(subCategoryId)
    .populate("categoryId", "folderId");
  if (!isSubcategoryExist)
    return next({ message: "SubCategory Not Found", cause: 404 });
  // brand check
  const isBrandExist = await brandModel.findOne({ name, subCategoryId });
  if (isBrandExist)
    return next({
      message: "There Is A Brand For This Subcategory",
      cause: 400,
    });
  // Category Check
  if (categoryId != isSubcategoryExist.categoryId._id)
    return next({ message: "Category Not Found", cause: 404 });
  // create slug
  const slug = slugify(name, { replacement: "-", lower: true, trim: true });
  // upload image
  if (!req.file)
    return next({ message: "Please Upload The Brand Logo", cause: 400 });
  // create folderId
  const folderId = generateUniqueString("123456asdfgh", 5);
  req.folder = `${process.env.MAIN_FOLDER}/Categories/${isSubcategoryExist.categoryId.folderId}/SubCategories/${isSubcategoryExist.folderId}/Brand/${folderId}`;
  const { secure_url, public_id } =
    await cloudinaryConnection().uploader.upload(req.file.path, {
      folder: `${process.env.MAIN_FOLDER}/Categories/${isSubcategoryExist.categoryId.folderId}/SubCategories/${isSubcategoryExist.folderId}/Brand/${folderId}`,
    });
  const newBrand = await brandModel.create({
    name,
    slug,
    folderId,
    Image: { secure_url, public_id },
    addedBy: _id,
    subCategoryId,
    categoryId,
  });
  req.savedDocuments = { model: brandModel, _id: newBrand._id };
  res.status(201).json({ message: "Create Done", newBrand });
};

//====================== update Brand ======================//
export const updateBrand = async (req, res, next) => {
  // distructuring the required date
  const { name, oldPublicId } = req.body;
  const { brandId } = req.params;
  const { _id } = req.authUser;

  // subCategory Check
  const brandExist = await brandModel.findOne({ addedBy: _id, _id: brandId });

  if (!brandExist) return next({ message: "brand not Found", cause: 404 });

  if (name) {
    //  check if the new Brand name different from the old name
    if (brandExist.name == name) {
      return next({
        message: "Please enter different brand name from the existing one.",
        cause: 400,
      });
    }
    //  check if the new Brand name is already exist
    const isNameDuplicated = await brandModel.findOne({ name });
    if (isNameDuplicated) {
      return next({ cause: 409, message: "brand name is already exist" });
    }

    //  update the brand name and the category slug
    brandExist.name = name;
    brandExist.slug = slugify(name, {
      replacement: "-",
      lower: true,
      trim: true,
    });
  }

  // check if the user update the image
  if (oldPublicId) {
    if (!req.file) return next({ cause: 400, message: "Image is required" });

    const folderPath = brandExist.Image.public_id.split(
      `${brandExist.folderId}/`
    )[0];
    const newPublicId = oldPublicId.split(`${brandExist.folderId}/`)[1];

    const { secure_url } = await cloudinaryConnection().uploader.upload(
      req.file.path,
      {
        folder: folderPath + `${brandExist.folderId}`,
        public_id: newPublicId,
      }
    );

    // update secure_url
    brandExist.Image.secure_url = secure_url;

    await brandExist.save();
    res.status(200).json({
      success: true,
      message: "brand updated successfully",
      data: brandExist,
    });
  }
};

//====================== delete brand ======================//
export const deletebrand = async (req, res, next) => {
  const { brandId } = req.params;

  // delete brand
  const deletedBrand = await brandModel.findByIdAndDelete(brandId);
  if (!deletedBrand) return next({ message: "brand not Found", cause: 404 });

  // delete the related products
  const products = await productModel.deleteMany({ brandId });
  if (products.deletedCount <= 0) {
    console.log(products.deletedCount);
    console.log("There is no related products");
  }

  //  delete the brand folder from cloudinary
  const folderPath = deletedBrand.Image.public_id.split(
    `${deletedBrand.folderId}/`
  )[0];

  await cloudinaryConnection().api.delete_resources_by_prefix(
    `${folderPath}${deletedBrand.folderId}`
  );
  await cloudinaryConnection().api.delete_folder(
    `${folderPath}${deletedBrand.folderId}`
  );

  res
    .status(200)
    .json({ success: true, message: "brand deleted successfully" });
};

// ========================== get all brands ================================ //

export const getAllBrands = async (req, res, next) => {
  const allBrands = await brandModel.find();
  res.status(200).json({ message: "Done", allBrands });
};

export const getAllBrandsForSubCategory = async (req, res, next) => {
  const { subCategoryId } = req.query;
  const allBrands = await brandModel.find({ subCategoryId });
  res
    .status(200)
    .json({
      message: "Done",
      allBrands: allBrands.length ? allBrands : "No Brands Found",
    });
};
export const getAllBrandsForCategory = async (req, res, next) => {
  const { CategoryId } = req.query;
  const allBrands = await brandModel.find({ CategoryId });
  res
    .status(200)
    .json({
      message: "Done",
      allBrands: allBrands.length ? allBrands : "No Brands Found",
    });
};

export const getBrandWithProducts = async (req, res, next)=> {
  const {page, size, sort} = req.query
  const features = new APIFeatures(brandModel.find().populate([ { path: 'Products'} ]))
  .pagination({page, size})
  .sort(sort)
  const brand = await features.mongooseQuery
  res.status(200).json({ msg: "Brands fetched successfully", data: brand })
}
