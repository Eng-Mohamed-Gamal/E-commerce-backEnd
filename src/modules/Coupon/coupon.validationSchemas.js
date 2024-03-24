import Joi from "joi";
import { generalValidationRule } from "../../utils/general.validation.rule.js";

export const addCouponSchema = {
  body: Joi.object({
    couponCode: Joi.string().required().min(3).max(30).alphanum(),
    couponAmount: Joi.number().required().min(1),
    isFixed: Joi.boolean(),
    isPercentage: Joi.boolean(),
    fromDate: Joi.date()
      .greater(Date.now() - 24 * 60 * 60 * 1000)
      .required(),
    toDate: Joi.date().greater(Joi.ref("fromDate")).required(),
    Users: Joi.array()
      .items(
        Joi.object({
          userId: generalValidationRule.dbId.required(),
          maxUsage: Joi.number().required().min(1),
        })
      )
      .required(),
  }),
};

export const applyCouponSchema = {
  body: Joi.object({
    couponCode: Joi.string().required().min(3).max(30).alphanum(),
  }),
};

export const disableEnableCouponSchema = {
  body: Joi.object({
    couponCode: Joi.string().required().min(3).max(30).alphanum(),
    status: Joi.string().valid("enabled", "disabled").required(),
  }),
};

export const getCouponsByStatusSchema = {
  body: Joi.object({
    status: Joi.string()
      .valid("valid", "expired", "enabled", "disabled")
      .required(),
  }),
};

export const getCouponByIdSChema = {
  query: Joi.object({
    couponId: generalValidationRule.dbId.required(),
  }),
};

export const updateCouponSchema = {
  query: Joi.object({
    couponId: generalValidationRule.dbId.required(),
  }),
  body: Joi.object({
    couponCode: Joi.string().required().min(3).max(30).alphanum(),
    couponAmount: Joi.number().required().min(1),
    isFixed: Joi.boolean(),
    isPercentage: Joi.boolean(),
    fromDate: Joi.date()
      .greater(Date.now() - 24 * 60 * 60 * 1000)
      .required(),
    toDate: Joi.date().greater(Joi.ref("fromDate")).required(),
    usersToAdd: Joi.array()
      .items(
        Joi.object({
          userId: generalValidationRule.dbId.required(),
          maxUsage: Joi.number().required().min(1),
        })
      )
      .required(),
  }),
};
