const Product = require("../domain/product");

function createProduct(repositories) {
  return async (name, price, weight) => {
    const product = new Product(name, price, weight);
    await repositories.product.create(product);
    return product;
  };
}

module.exports = createProduct;
