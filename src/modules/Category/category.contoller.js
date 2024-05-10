import Category from "../../../DB/Models/category.model.js";
import slugify from "slugify";
import cloudinaryConnection from "../../utils/cloudinary.js";
import generateUniqueString from "../../utils/generate-Unique-String.js";
import subCategoryModel from "../../../DB/Models/sub-category.model.js";
import brandModel from "../../../DB/Models/brand.model.js";
import { APIFeatures } from "../../utils/api-features.js";

//============================== add category ==============================//
export const addCategory = async (req, res, next) => {
  // 1- destructuring the request body
  const { name } = req.body;
  const { _id } = req.authUser;

  // 2- check if the category name is already exist
  const isNameDuplicated = await Category.findOne({ name });
  if (isNameDuplicated) {
    return next({ cause: 409, message: "Category name is already exist" });
    // return next( new Error('Category name is already exist' , {cause:409}) )
  }

  // 3- generate the slug
  const slug = slugify(name, "-");

  // 4- upload image to cloudinary
  if (!req.file) return next({ cause: 400, message: "Image is required" });

  const folderId = generateUniqueString("123456asdfgh", 5);
  const { secure_url, public_id } =
    await cloudinaryConnection().uploader.upload(req.file.path, {
      folder: `${process.env.MAIN_FOLDER}/Categories/${folderId}`,
    });

  req.folder = `${process.env.MAIN_FOLDER}/Categories/${folderId}`;

  // 5- generate the categroy object
  const category = {
    name,
    slug,
    Image: { secure_url, public_id },
    folderId,
    addedBy: _id,
  };
  // 6- create the category
  const categoryCreated = await Category.create(category);
  req.savedDocuments = { model: Category, _id: categoryCreated._id };
  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: categoryCreated,
  });
};

//================================ upadte category ================================//
export const updateCategory = async (req, res, next) => {
  // 1- destructuring the request body
  const { name, oldPublicId } = req.body;
  // 2- destructuring the request params
  const { categoryId } = req.params;
  // 3- destructuring _id from the request authUser
  const { _id } = req.authUser;

  // 4- check if the category is exist bu using categoryId
  const category = await Category.findById(categoryId);
  if (!category) return next({ cause: 404, message: "Category not found" });

  // 5- check if the use want to update the name field
  if (name) {
    // 5.1 check if the new category name different from the old name
    if (name == category.name) {
      return next({
        cause: 400,
        message: "Please enter different category name from the existing one.",
      });
    }

    // 5.2 check if the new category name is already exist
    const isNameDuplicated = await Category.findOne({ name });
    if (isNameDuplicated) {
      return next({ cause: 409, message: "Category name is already exist" });
    }

    // 5.3 update the category name and the category slug
    category.name = name;
    category.slug = slugify(name, "-");
  }

  // 6- check if the user want to update the image
  if (oldPublicId) {
    if (!req.file) return next({ cause: 400, message: "Image is required" });

    const newPulicId = oldPublicId.split(`${category.folderId}/`)[1];

    const { secure_url } = await cloudinaryConnection().uploader.upload(
      req.file.path,
      {
        folder: `${process.env.MAIN_FOLDER}/Categories/${category.folderId}`,
        public_id: newPulicId,
      }
    );

    category.Image.secure_url = secure_url;
  }

  // 7- set value for the updatedBy field
  category.updatedBy = _id;

  await category.save();
  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: category,
  });
};

//============================== get all categories ==============================//
export const getAllCategories = async (req, res, next) => {
  const { page, size } = req.query;
  const { tillWhat } = req.body;

  if (tillWhat === "subCategories") {
    const categories = Category.find().populate([
      {
        path: "subCategories",
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  }
  if (tillWhat === "brands") {
    const features = new APIFeatures(
      Category.find().populate([
        {
          path: "subCategories",
          populate: { path: "Brands" },
        },
      ])
    ).pagination({ page, size });
    const categories = await features.mongooseQuery;

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  }
  if (tillWhat === "products") {
    const features = new APIFeatures(
      Category.find().populate([
        {
          path: "subCategories",
          populate: { path: "Brands", populate: { path: "Products" } },
        },
      ])
    ).pagination({ page, size });
    const categories = await features.mongooseQuery;

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  }
  if (!tillWhat) {
    const categories = await Category.find();
    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  }
};

//====================== delete category ======================//
export const deleteCategory = async (req, res, next) => {
  const { categoryId } = req.params;

  // 1- delete category
  const catgory = await Category.findByIdAndDelete(categoryId);
  if (!catgory) return next({ cause: 404, message: "Category not found" });

  // 2-delete the related subcategories
  const subCategories = await subCategoryModel.deleteMany({ categoryId });
  if (subCategories.deletedCount <= 0) {
    console.log(subCategories.deletedCount);
    console.log("There is no related subcategories");
  }

  //3- delete the related brands
  const brands = await brandModel.deleteMany({ categoryId });
  if (brands.deletedCount <= 0) {
    console.log(brands.deletedCount);
    console.log("There is no related brands");
  }

  // 4- delete the related products
  const products = await brandModel.deleteMany({ subCategoryId });
  if (products.deletedCount <= 0) {
    console.log(products.deletedCount);
    console.log("There is no related products");
  }

  // 5- delete the category folder from cloudinary
  await cloudinaryConnection().api.delete_resources_by_prefix(
    `${process.env.MAIN_FOLDER}/Categories/${catgory.folderId}`
  );
  await cloudinaryConnection().api.delete_folder(
    `${process.env.MAIN_FOLDER}/Categories/${catgory.folderId}`
  );

  res
    .status(200)
    .json({ success: true, message: "Category deleted successfully" });
};

export const getCategoryById = async (req, res, next) => {
  const { categoryId } = req.params;
  const category = await Category.findById(categoryId);
  if (!category) return next({ message: "Category Not Found", cause: 404 });
  return res.status(200).json({ message: "Done", category });
};
