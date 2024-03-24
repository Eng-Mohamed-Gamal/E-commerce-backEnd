import SubCategory from "../../../DB/Models/sub-category.model.js";
import Category from "../../../DB/Models/category.model.js";
import generateUniqueString from "../../utils/generate-Unique-String.js";
import cloudinaryConnection from "../../utils/cloudinary.js";
import slugify from "slugify";
import brandModel from "../../../DB/Models/brand.model.js";
import productModel from "../../../DB/Models/product.model.js";

//============================== add SubCategory ==============================//
export const addSubCategory = async (req, res, next) => {
  // 1- destructuring the request body
  const { name } = req.body;
  const { categoryId } = req.params;
  const { _id } = req.authUser;

  // 2- check if the subcategory name is already exist
  const isNameDuplicated = await SubCategory.findOne({ name });
  if (isNameDuplicated) {
    return next({ cause: 409, message: "SubCategory name is already exist" });
    // return next( new Error('Category name is already exist' , {cause:409}) )
  }

  // 3- check if the category is exist by using categoryId
  const category = await Category.findById(categoryId);
  if (!category) return next({ cause: 404, message: "Category not found" });

  // 4- generate the slug
  const slug = slugify(name, "-");

  // 5- upload image to cloudinary
  if (!req.file) return next({ cause: 400, message: "Image is required" });

  const folderId = generateUniqueString("123456asdfgh", 5);
  req.folder = `${process.env.MAIN_FOLDER}/Categories/${category.folderId}/SubCategories/${folderId}`;

  const { secure_url, public_id } =
    await cloudinaryConnection().uploader.upload(req.file.path, {
      folder: `${process.env.MAIN_FOLDER}/Categories/${category.folderId}/SubCategories/${folderId}`,
    });

  // 6- generate the subCategory object
  const subCategory = {
    name,
    slug,
    Image: { secure_url, public_id },
    folderId,
    addedBy: _id,
    categoryId,
  };
  // 7- create the subCategory
  const subCategoryCreated = await SubCategory.create(subCategory);
  req.savedDocuments = { model: SubCategory, _id: subCategoryCreated._id };
  res.status(201).json({
    success: true,
    message: "subCategory created successfully",
    data: subCategoryCreated,
  });
};

//====================== update subCategory ======================//
export const updateSubCategory = async (req, res, next) => {
  // distructuring the required date
  const { name, oldPublicId } = req.body;
  const { subCategoryId } = req.params;
  const { _id } = req.authUser;

  // subCategory Check
  const SubCategoryExist = await SubCategory.findById(subCategoryId);

  if (!SubCategoryExist)
    return next({ message: "subCategory not Found", cause: 404 });

  if (name) {
    //  check if the new subCategory name different from the old name
    if (SubCategoryExist.name == name) {
      return next({
        message:
          "Please enter different subCategory name from the existing one.",
        cause: 400,
      });
    }
    //  check if the new subCategory name is already exist
    const isNameDuplicated = await SubCategory.findOne({ name });
    if (isNameDuplicated) {
      return next({ cause: 409, message: "subCategory name is already exist" });
    }

    //  update the subCategory name and the category slug
    SubCategoryExist.name = name;
    SubCategoryExist.slug = slugify(name, {
      replacement: "-",
      lower: true,
      trim: true,
    });
  }

  // check if the user update the image
  if (oldPublicId) {
    if (!req.file) return next({ cause: 400, message: "Image is required" });

    const folderPath = SubCategoryExist.Image.public_id.split(
      `${SubCategoryExist.folderId}/`
    )[0];
    const newPublicId = oldPublicId.split(`${SubCategoryExist.folderId}/`)[1];

    const { secure_url } = await cloudinaryConnection().uploader.upload(
      req.file.path,
      {
        folder: folderPath + `${SubCategoryExist.folderId}`,
        public_id: newPublicId,
      }
    );

    // update secure_url
    SubCategoryExist.Image.secure_url = secure_url;

    // set value to updatedBy
    SubCategoryExist.updatedBy = _id;

    await SubCategoryExist.save();
    res
      .status(200)
      .json({
        success: true,
        message: "subCategory updated successfully",
        data: SubCategoryExist,
      });
  }
};

//====================== delete subCategory ======================//
export const deleteSubCategory = async (req, res, next) => {
  const { subCategoryId } = req.params;

  // check subCategory
  const subCategory = await SubCategory.findByIdAndDelete(subCategoryId);
  if (!subCategory)
    return next({ message: "subCategory not Found", cause: 404 });

  // delete the related brands
  const brands = await brandModel.deleteMany({ subCategoryId });
  if (brands.deletedCount <= 0) {
    console.log(brands.deletedCount);
    console.log("There is no related brands");
  }

  // delete the related products
  const products = await productModel.deleteMany({ subCategoryId });
  if (products.deletedCount <= 0) {
    console.log(products.deletedCount);
    console.log("There is no related products");
  }

  //  delete the subCategory folder from cloudinary
  const folderPath = subCategory.Image.public_id.split(
    `${subCategory.folderId}/`
  )[0];

  await cloudinaryConnection().api.delete_resources_by_prefix(
    `${folderPath}${subCategory.folderId}`
  );
  await cloudinaryConnection().api.delete_folder(
    `${folderPath}${subCategory.folderId}`
  );

  res
    .status(200)
    .json({ success: true, message: "subCategory deleted successfully" });
};

//====================== getAllSubCategoriesWithBrand ======================//

export const getAllSubCategoriesWithBrand = async (req, res, next) => {
  // get all subCategories with brands
  const subCategories = await SubCategory.find().populate("Brands");
  return res.status(200).json({ message: "Done", subCategories });
};

export const getAllSubCategoriesForCategory = async (req, res, next) => {
  const { categoryId } = req.query;
  // get all subCategories
  const subCategories = await SubCategory.find({ categoryId });
  return res
    .status(200)
    .json({
      message: "Done",
      subCategories: subCategories.length
        ? subCategories
        : "No Subcategories Founds",
    });
};
export const getSubCategoryBId = async (req, res, next) => {
  const { subCategoryId } = req.query;
  // get subCategory
  const subCategory = await SubCategory.findById({ subCategoryId });
  if(!subCategory) return next({message : "No Subcategory Found" , cause : 404})
  return res.status(200).json({ message: "Done", subCategory });
};
