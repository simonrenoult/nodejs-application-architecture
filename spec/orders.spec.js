const { expect } = require("chai");
const { testUtils, queryApi } = require("./helpers");

describe("Orders", () => {
  testUtils.startApi();

  beforeEach(async () => await testUtils.deleteAllOrder());

  describe("GET /orders", () => {
    describe("When there is no order", () => {
      it("returns 200", async () => {
        const { statusCode } = await queryApi("GET", "/orders");
        expect(statusCode).to.equal(200);
      });

      it("returns an empty list", async () => {
        const { body } = await queryApi("GET", "/orders");
        expect(body).to.deep.equal([]);
      });
    });

    describe("When there is a single order", () => {
      beforeEach(async () => await testUtils.addOrder({}, true));

      it("returns 200", async () => {
        const { statusCode } = await queryApi("GET", "/orders");
        expect(statusCode).to.equal(200);
      });

      it("returns a list with one item", async () => {
        const { body } = await queryApi("GET", "/orders");
        expect(body.length).to.deep.equal(1);
      });
    });
  });

  describe("GET /orders/:id", () => {
    describe("When order does not exist", () => {
      it("returns 404", async () => {
        const { statusCode } = await queryApi("GET", "/orders/unknown");
        expect(statusCode).to.equal(404);
      });
    });

    describe("When the order exists", () => {
      beforeEach(async () => {
        const { headers } = await testUtils.addOrder();
        this.location = headers.location;
      });

      it("returns 200", () => async () => {
        const { statusCode } = await queryApi("GET", this.location);
        expect(statusCode).to.equal(200);
      });

      it("has a status", async () => {
        const { body } = await queryApi("GET", this.location);
        expect(body.status).to.exist;
      });

      it("has a total_amount", async () => {
        const { body } = await queryApi("GET", this.location);
        expect(body.total_amount).to.exist;
      });

      it("has a shipment_amount", async () => {
        const { body } = await queryApi("GET", this.location);
        expect(body.shipment_amount).to.exist;
      });

      it("has a total_weight", async () => {
        const { body } = await queryApi("GET", this.location);
        expect(body.total_weight).to.exist;
      });
    });
  });

  describe("POST /orders", () => {
    describe("When order products are missing", () => {
      it("returns 400", async () => {
        const { statusCode } = await queryApi("POST", "/orders", {
          body: {}
        });
        expect(statusCode).to.equal(400);
      });

      it("returns the keys in error", async () => {
        const { body } = await queryApi("POST", "/orders", { body: {} });
        const contextList = body.data.map(item => item.context.key);
        expect(contextList).to.contain("product_list");
      });
    });

    describe("When order products are provided", () => {
      describe("When product.js does not exist", () => {
        it("returns 400", async () => {
          const data = { product_list: [1234] };
          const { statusCode } = await queryApi("POST", "/orders", {
            body: data
          });
          expect(statusCode).to.equal(400);
        });

        it("returns the keys in error", async () => {
          const { body } = await queryApi("POST", "/orders", { body: {} });
          const contextList = body.data.map(item => item.context.key);
          expect(contextList).to.contain("product_list");
        });
      });

      describe("When product.js exists", () => {
        beforeEach(async () => {
          const product = await testUtils.addProduct();
          this.productId = product.headers.location.slice("/products/".length);
        });

        it("returns 201", async () => {
          const data = { product_list: [this.productId] };
          const { statusCode } = await queryApi("POST", "/orders", {
            body: data
          });
          expect(statusCode).to.equal(201);
        });

        it("adds a new order", async () => {
          const data = { product_list: [this.productId] };
          await queryApi("POST", "/orders", { body: data });
          const { body } = await queryApi("GET", "/orders");
          expect(body.length).to.equal(1);
        });

        describe("status", () => {
          it("is set to 'pending'", async () => {
            const data = { product_list: [this.productId] };
            const { headers } = await queryApi("POST", "/orders", {
              body: data
            });
            const { body } = await queryApi("GET", headers.location);
            expect(body.status).to.equal("pending");
          });
        });

        describe("total_amount", () => {
          describe("When it exceeds 1000", () => {
            it("is discounted by 5%", async () => {
              const { headers } = await testUtils.addProduct({
                price: 2000,
                weight: 1
              });
              const productId = headers.location.slice("/products/".length);

              const order = await testUtils.addOrder(false, [productId]);
              const { body } = await queryApi("GET", order.headers.location);
              expect(body.total_amount).to.equal(1900);
            });
          });

          it("is equal to the total amount of the product.js plus the shipment amount", async () => {
            const productList = await Promise.all([
              testUtils.addProduct({ price: 8, weight: 5 }),
              testUtils.addProduct({ price: 15, weight: 1 }),
              testUtils.addProduct({ price: 24, weight: 0.3 })
            ]);

            const productIdList = productList.map(product =>
              parseInt(product.headers.location.slice("/products/".length), 10)
            );

            const { headers } = await queryApi("POST", "/orders", {
              body: { product_list: productIdList }
            });

            const { body } = await queryApi("GET", headers.location);

            expect(body.shipment_amount).to.equal(25);
          });
        });

        describe("shipment_amount", () => {
          describe("adds 25 for each 10 more kilograms", () => {
            describe("When order weight is < 10kg", () => {
              it("sets 'shipment_amount' to '25'", async () => {
                const product = await testUtils.addProduct({ weight: 8 });
                const productId = product.headers.location.slice(
                  "/products/".length
                );
                const data = { product_list: [productId] };
                const { headers } = await queryApi("POST", "/orders", {
                  body: data
                });
                const { body } = await queryApi("GET", headers.location);
                expect(body.shipment_amount).to.equal(25);
              });
            });

            describe("When order weight is 15kg", () => {
              it("sets 'shipment_amount' to '50'", async () => {
                const product = await testUtils.addProduct({ weight: 15 });
                const productId = product.headers.location.slice(
                  "/products/".length
                );
                const data = { product_list: [productId] };
                const { headers } = await queryApi("POST", "/orders", {
                  body: data
                });
                const { body } = await queryApi("GET", headers.location);
                expect(body.shipment_amount).to.equal(50);
              });
            });

            describe("When order weight is 20kg", () => {
              it("sets 'shipment_amount' to '50'", async () => {
                const product = await testUtils.addProduct({ weight: 20 });
                const productId = product.headers.location.slice(
                  "/products/".length
                );
                const data = { product_list: [productId] };
                const { headers } = await queryApi("POST", "/orders", {
                  body: data
                });
                const { body } = await queryApi("GET", headers.location);
                expect(body.shipment_amount).to.equal(50);
              });
            });

            describe("When order weight is 30kg", () => {
              it("sets 'shipment_amount' to '75'", async () => {
                const product = await testUtils.addProduct({ weight: 30 });
                const productId = product.headers.location.slice(
                  "/products/".length
                );
                const data = { product_list: [productId] };
                const { headers } = await queryApi("POST", "/orders", {
                  body: data
                });
                const { body } = await queryApi("GET", headers.location);
                expect(body.shipment_amount).to.equal(75);
              });
            });
          });
        });
      });
    });
  });

  describe("DELETE /orders", () => {
    describe("When there is no order", () => {
      it("returns 204", async () => {
        const { statusCode } = await queryApi("DELETE", "/orders");
        expect(statusCode).to.equal(204);
      });
    });

    describe("When there are orders", () => {
      beforeEach(async () => await testUtils.addOrder());
      beforeEach(async () => await testUtils.addOrder());

      it("returns 204", async () => {
        const { statusCode } = await queryApi("DELETE", "/orders");
        expect(statusCode).to.equal(204);
      });

      it("removes all the orders", async () => {
        const firstRequest = await queryApi("GET", "/orders");
        expect(firstRequest.body.length).to.equal(2);
        await queryApi("DELETE", "/orders");
        const secondRequest = await queryApi("GET", "/orders");
        expect(secondRequest.body.length).to.equal(0);
      });
    });
  });

  describe("PUT /orders/:id/status", () => {
    describe("When order does not exist", () => {
      it("returns 404", async () => {
        const { statusCode } = await queryApi("PUT", "/orders/unknown/status", {
          body: { status: "paid" }
        });
        expect(statusCode).to.equal(404);
      });
    });

    describe("When status exists", () => {
      describe("when new status is not pending, paid or cancelled", () => {
        it("returns 400", async () => {
          const { headers } = await testUtils.addOrder();
          const orderId = headers.location.slice("/orders/".length);
          const { statusCode } = await queryApi(
            "PUT",
            `/orders/${orderId}/status`,
            { body: { status: "unknwown" } }
          );
          expect(statusCode).to.equal(400);
        });
      });

      describe("when new status is pending", () => {
        it("is returns 200", async () => {
          const { headers } = await testUtils.addOrder();
          const orderId = headers.location.slice("/orders/".length);
          const { statusCode } = await queryApi(
            "PUT",
            `/orders/${orderId}/status`,
            { body: { status: "pending" } }
          );
          expect(statusCode).to.equal(200);
        });
      });

      describe("when new status is paid", () => {
        it("is returns 200", async () => {
          const { headers } = await testUtils.addOrder();
          const orderId = headers.location.slice("/orders/".length);
          const { statusCode } = await queryApi(
            "PUT",
            `/orders/${orderId}/status`,
            { body: { status: "pending" } }
          );
          expect(statusCode).to.equal(200);
        });

        it("updates the order", async () => {
          const { headers } = await testUtils.addOrder();
          const orderId = headers.location.slice("/orders/".length);
          await queryApi("PUT", `/orders/${orderId}/status`, {
            body: { status: "paid" }
          });
          const { body } = await queryApi("GET", headers.location);
          expect(body.status).to.equal("paid");
        });
      });

      describe("when new status is cancelled", () => {
        it("is returns 200", async () => {
          const { headers } = await testUtils.addOrder();
          const orderId = headers.location.slice("/orders/".length);
          const { statusCode } = await queryApi(
            "PUT",
            `/orders/${orderId}/status`,
            { body: { status: "pending" } }
          );
          expect(statusCode).to.equal(200);
        });

        it("updates the order", async () => {
          const { headers } = await testUtils.addOrder();
          const orderId = headers.location.slice("/orders/".length);
          await queryApi("PUT", `/orders/${orderId}/status`, {
            body: { status: "cancelled" }
          });
          const { body } = await queryApi("GET", headers.location);
          expect(body.status).to.equal("cancelled");
        });
      });
    });
  });
});
