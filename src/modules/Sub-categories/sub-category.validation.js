import Joi from "joi";

export const addSubCategorySchema = {
  body: Joi.object({
    name: Joi.string().required().min(3).max(50).trim(),
  }),
  params: Joi.object({
    categoryId: Joi.string().length(24).hex().required(),
  }),
};

export const updateSubCategorySchema = {
  body: Joi.object({
    name: Joi.string().optional().min(3).max(50).trim(),
    oldPublicId: Joi.string().optional(),
  }),
  params: Joi.object({
    subCategoryId: Joi.string().length(24).hex().required(),
  }),
};

export const getSubCategoryByIdSchema = {
  params: Joi.object({
    subCategoryId: Joi.string().length(24).hex().required(),
  }),
};
export const getAllSubCategoriesForCategory = {
  params: Joi.object({
    categoryId: Joi.string().length(24).hex().required(),
  }),
};

export const deleteSubCategorySchema = {
  params: Joi.object({
    subCategoryId: Joi.string().length(24).hex().required(),
  }),
};
