const Joi = require("joi");

function models() {
  const product = Joi.object().keys({
    name: Joi.required(),
    price: Joi.required(),
    weight: Joi.required()
  });

  const order = Joi.object().keys({
    product_list: Joi.array()
      .items(Joi.number())
      .required()
  });

  return { product, order };
}

module.exports = models;
