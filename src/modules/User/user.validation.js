import { systemRoles } from "../../utils/system-roles.js";

export const updateProfile = {
  body: Joi.object({
    username: Joi.string().min(3).max(10).trim(),
    email: Joi.string().email(),
    phoneNumbers: Joi.array().items(Joi.string().length(11).trim()),
    addresses: Joi.array().items(Joi.string().trim()),
    age: Joi.number().max(80).min(18),
    role: Joi.string()
      .valid(
        systemRoles.USER,
        systemRoles.SUPER_ADMIN,
        systemRoles.ADMIN,
        systemRoles.DELIEVER_ROLE
      )
      .default("user"),
  }),
};
