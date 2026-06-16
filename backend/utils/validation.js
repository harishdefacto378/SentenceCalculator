const Joi = require("joi");
const AppError = require("./appError");

const createSentenceSchema = Joi.object({
  df_age: Joi.number().required(),
  df_confiscationdate: Joi.string().required(),
  df_drugquantitypercentage: Joi.number().required(),
  df_fine: Joi.number().required(),
  df_gender: Joi.number().required(),
  df_quantitydetained: Joi.number().required(),
  df_quantitydetainedingram: Joi.number().required(),
  df_quantitytype: Joi.number().required(),
  df_sentencedays: Joi.number().required(),
  df_sentenceyymmdd: Joi.string().required(),
  df_unit: Joi.number().required(),
  df_multiplierforcommerical: Joi.number().required(),
}).unknown(true);

function validateCreateSentence(req, _res, next) {
  const { error, value } = createSentenceSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return next(
      new AppError("VALIDATION_ERROR", "Invalid request payload", 400, {
        errors: error.details.map((item) => item.message),
      })
    );
  }

  req.body = value;
  return next();
}

module.exports = {
  validateCreateSentence,
};
