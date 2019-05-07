const { assert, required } = require("joi");

class Product {
  constructor(name, price, weight) {
    assert(name, required());
    assert(price, required());
    assert(weight, required());

    this.name = name;
    this.price = price;
    this.weight = weight;
  }
}

module.exports = Product;
