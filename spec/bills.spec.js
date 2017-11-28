const { expect } = require("chai");
const { testUtils, queryApi } = require("./helpers");

describe("Bills", () => {
  testUtils.startApi();

  beforeEach(async () => await testUtils.deleteAllBill());

  describe("GET /bills", () => {
    describe("When there is no bill", () => {
      it("returns 200", async () => {
        const { statusCode } = await queryApi("GET", "/bills");
        expect(statusCode).to.equal(200);
      });

      it("returns an empty list", async () => {
        const { body } = await queryApi("GET", "/bills");
        expect(body).to.deep.equal([]);
      });
    });

    describe("When there is a single bill", () => {
      beforeEach(async () => await testUtils.addBill());

      it("returns 200", async () => {
        const { statusCode } = await queryApi("GET", "/bills");
        expect(statusCode).to.equal(200);
      });

      it("returns a list with one item", async () => {
        const { body } = await queryApi("GET", "/bills");
        expect(body.length).to.deep.equal(1);
      });
    });
  });

  describe("DELETE /bills", () => {
    describe("When there is no bill", () => {
      it("returns 204", async () => {
        const { statusCode } = await queryApi("DELETE", "/bills");
        expect(statusCode).to.equal(204);
      });
    });

    describe("When there are bills", () => {
      beforeEach(async () => await testUtils.addBill());
      beforeEach(async () => await testUtils.addBill());

      it("returns 204", async () => {
        const { statusCode } = await queryApi("DELETE", "/bills");
        expect(statusCode).to.equal(204);
      });

      it("removes all the bills", async () => {
        const firstRequest = await queryApi("GET", "/bills");
        expect(firstRequest.body.length).to.equal(2);
        await queryApi("DELETE", "/bills");
        const secondRequest = await queryApi("GET", "/bills");
        expect(secondRequest.body.length).to.equal(0);
      });
    });
  });
});
