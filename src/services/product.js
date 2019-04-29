const Joi = require("joi");

function services(models, schemas) {
  return {
    create: createProduct,
    list: listProducts,
    show: showProduct,
    deleteAll: deleteProducts
  };

  async function createProduct(req, res) {
    const { error } = Joi.validate(req.body, schemas.product, {
      abortEarly: false
    });

    if (error) {
      // Create the HTTP response error list
      const errorMessage = error.details.map(({ message, context }) =>
        Object.assign({ message, context })
      );
      return res.status(400).send({ data: errorMessage });
    }

    const product = await models.product.create(req.body);
    res.set("Location", `/products/${product.id}`);
    res.status(201).send();
  }

  async function listProducts(req, res) {
    let productList = await models.product.findAll();
    const { sort } = req.query;
    productList = productList.sort((a, b) => {
      if (a[sort] < b[sort]) return -1;
      if (a[sort] > b[sort]) return 1;
      return 0;
    });
    res.status(200).json(productList);
  }

  async function showProduct(req, res) {
    const { id } = req.params;
    const product = await models.product.findByPk(id);
    if (!product) return res.status(404).send();
    return res.status(200).json(product.toJSON());
  }

  async function deleteProducts(req, res) {
    const productList = await models.product.findAll();
    productList.forEach(product => product.destroy());
    res.status(204).send();
  }
}

module.exports = services;
