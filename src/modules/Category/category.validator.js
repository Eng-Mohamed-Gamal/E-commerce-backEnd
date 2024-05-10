import Joi from "joi";

export const addCategorySchema = {
  body: Joi.object({
    name: Joi.string().required().min(3).max(20).alphanum(),
  }),
};

export const updateCategorySchema = {
  body: Joi.object({
    name: Joi.string().optional().min(3).max(20).alphanum(),
    oldPublicId: Joi.string().optional(),
  }),
  query: Joi.object({
    categoryId: Joi.string().length(24).hex().required(),
  }),
};

export const deleteCategorySchema = {
  params: Joi.object({
    categoryId: Joi.string().length(24).hex().required(),
  }),
};

export const getCategoryByIdSchema = {
  params: Joi.object({
    categoryId: Joi.string().length(24).hex().required(),
  }),
};
export const getAllCategoriesSchema = {
  query: Joi.object({
    page: Joi.number().integer().optional(),
    size: Joi.number().integer().optional(),
  }),
  body: Joi.object({
    tillWhat: Joi.string()
      .optional()
      .valid("products", "brands", "subCategories"),
  }),
};
