const { expect } = require("chai");
const { testUtils, queryApi } = require("./helpers");

describe("Products", () => {
  testUtils.startApi();
  beforeEach(async () => await testUtils.deleteAllProduct());

  describe("GET /products", () => {
    describe("When there is no product", () => {
      it("returns 200", async () => {
        const { statusCode } = await queryApi("GET", "/products");
        expect(statusCode).to.equal(200);
      });

      it("returns an empty list", async () => {
        const { body } = await queryApi("GET", "/products");
        expect(body).to.deep.equal([]);
      });
    });

    describe("When there is a single product", () => {
      beforeEach(async () => await testUtils.addProduct());

      it("returns 200", async () => {
        const { statusCode } = await queryApi("GET", "/products");
        expect(statusCode).to.equal(200);
      });

      it("returns a list with one item", async () => {
        const { body } = await queryApi("GET", "/products");
        expect(body.length).to.deep.equal(1);
      });
    });

    describe("When there are several products", () => {
      beforeEach(async () => {
        await testUtils.addProduct({ name: "tshirt", weight: 0.1, price: 10 });
        await testUtils.addProduct({ name: "mug", weight: 0.3, price: 8 });
        await testUtils.addProduct({ name: "bottle", weight: 0.2, price: 15 });
      });

      describe("When sorted by name", () => {
        it("returns the appropriate order", async () => {
          const { body } = await queryApi("GET", "/products?sort=name");
          const nameList = body.map(product => product.name);
          expect(nameList).to.deep.equal(["bottle", "mug", "tshirt"]);
        });
      });

      describe("When sorted by weight", () => {
        it("returns the appropriate order", async () => {
          const { body } = await queryApi("GET", "/products?sort=weight");
          const weightList = body.map(product => product.weight);
          expect(weightList).to.deep.equal([0.1, 0.2, 0.3]);
        });
      });

      describe("When sorted by price", () => {
        it("returns the appropriate order", async () => {
          const { body } = await queryApi("GET", "/products?sort=price");
          const priceList = body.map(product => product.price);
          expect(priceList).to.deep.equal([8, 10, 15]);
        });
      });
    });
  });

  describe("GET /products/:id", () => {
    describe("When product does not exist", () => {
      it("returns 404", async () => {
        const { statusCode } = await queryApi("GET", "/products/unknown");
        expect(statusCode).to.equal(404);
      });
    });

    describe("When the product exists", () => {
      beforeEach(async () => {
        const { headers } = await testUtils.addProduct();
        this.location = headers.location;
      });

      it("returns 200", () => async () => {
        const { statusCode } = await queryApi("GET", this.location);
        expect(statusCode).to.equal(200);
      });

      it("returns the product", async () => {
        const { body } = await queryApi("GET", this.location);
        expect(body.name).to.exist;
        expect(body.weight).to.exist;
        expect(body.price).to.exist;
      });
    });
  });

  describe("POST /products", () => {
    describe("When product data is missing", () => {
      it("returns 400", async () => {
        const { statusCode } = await queryApi("POST", "/products", {
          body: {}
        });
        expect(statusCode).to.equal(400);
      });

      it("returns the keys in error", async () => {
        const { body } = await queryApi("POST", "/products", { body: {} });
        const contextList = body.data.map(item => item.context.key);
        expect(contextList).to.contain("name", "price", "weight");
      });
    });

    describe("When product data is valid", () => {
      it("returns 201", async () => {
        const data = { name: "tshirt", price: 20, weight: 0.1 };
        const { statusCode } = await queryApi("POST", "/products", {
          body: data
        });
        expect(statusCode).to.equal(201);
      });

      it("adds a new product", async () => {
        const data = { name: "tshirt", price: 20, weight: 0.1 };
        await queryApi("POST", "/products", { body: data });
        const { body } = await queryApi("GET", "/products");
        expect(body.length).to.equal(1);
      });

      it("contains the appropriate data", async () => {
        const data = { name: "tshirt", price: 20, weight: 0.1 };
        const { headers } = await queryApi("POST", "/products", { body: data });
        const { body } = await queryApi("GET", headers.location);
        expect(body.name).to.equal(data.name);
        expect(body.price).to.equal(data.price);
        expect(body.weight).to.equal(data.weight);
      });
    });
  });

  describe("DELETE /products", () => {
    describe("When there is no product", () => {
      it("returns 204", async () => {
        const { statusCode } = await queryApi("DELETE", "/products");
        expect(statusCode).to.equal(204);
      });
    });

    describe("When there are products", () => {
      beforeEach(async () => await testUtils.addProduct());
      beforeEach(async () => await testUtils.addProduct());

      it("returns 204", async () => {
        const { statusCode } = await queryApi("DELETE", "/products");
        expect(statusCode).to.equal(204);
      });

      it("removes all the products", async () => {
        const firstRequest = await queryApi("GET", "/products");
        expect(firstRequest.body.length).to.equal(2);
        await queryApi("DELETE", "/products");
        const secondRequest = await queryApi("GET", "/products");
        expect(secondRequest.body.length).to.equal(0);
      });
    });
  });
});
