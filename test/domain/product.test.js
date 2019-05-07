const { expect } = require("chai");
const { describe } = require("mocha");
const Product = require("../../src/domain/product");

describe("Product", () => {
  describe("#constructor", () => {

    describe("when name is missing", () => {
      it("throws an error", () => {
        expect(() => new Product()).to.throw(Error);
      });
    });

    describe("when price is missing", () => {
      it("throws an error", () => {
        expect(() => new Product("tshirt")).to.throw(Error);
      });
    });

    describe("when weight is missing", () => {
      it("throws an error", () => {
        expect(() => new Product("tshirt", 10.0)).to.throw(Error);
      });
    });
  });
});
