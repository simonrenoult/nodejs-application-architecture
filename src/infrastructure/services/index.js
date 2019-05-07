function services(models, schemas) {
  return {
    product: require("./product")(models, schemas),
    order: require("./order")(models, schemas),
    bill: require("./bill")(models, schemas)
  };
}

module.exports = services;
