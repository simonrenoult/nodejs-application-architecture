const got = require("got");
const faker = require("faker");
const application = require("..");

const PORT = process.env.PORT || 1337;

async function queryApi(method, resource, options) {
  const customOptions = Object.assign({}, options, { json: true, method });
  let response;
  try {
    response = await got(`http://localhost:${PORT}${resource}`, customOptions);
  } catch (error) {
    response = error.response;
  }
  return response;
}

exports.queryApi = queryApi;
exports.testUtils = {
  startApi() {
    let server;

    before(done => {
      application().then(app => {
        server = app.listen(PORT, done);
      });
    });

    after(() => {
      server.close();
    });
  },

  async addProduct(data) {
    const defaultProduct = {
      name: faker.commerce.product(),
      price: faker.finance.amount(),
      weight: faker.random.number()
    };
    const body = Object.assign(defaultProduct, data);
    return await queryApi("POST", "/products", { body });
  },

  async deleteAllProduct() {
    return await queryApi("DELETE", "/products");
  }
};
