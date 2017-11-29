# Node.js: beyond the route layer

> A discussion about how Node.js projects can be organized.


## Features

Shopping API with products, orders and bills.
* Products
  * Can be listed, created, found by id, deleted
  * Have an identifier, a name, a price and a weight
  * Products can be sorted by name, price or weight
* Orders
  * Can be created, listed, found by id and deleted
  * Have a status, a product list, a shipment amount, a total amount and a weight
  * Orders status can be pending, paid or canceled
  * Are offered 5% discount when the price exceeds 1000€
  * Shipment costs 25€ for every 10 more kg (50€ for 20kg, 75€ for 30kg, etc.)
* Bills
  * Can be listed
  * Have an amount and a creation date
  * Are automatically generated when an order status is set to paid

Note: delete routes are there for testing purposes.


## What's wrong?

It mostly boils down to two design flaws:
  * heavy coupling
  * multiple responsibility

Indeed, the `index.js` file does everything:
  * server initialization
  * database connection
  * environment support
  * logging
  * route declaration
  * HTTP deserialization
  * configuration logic
  * business logic
  * database bindings
  * HTTP serialization
  
What's more, business and infrastructure logic depend on each other. For instance, in order to create an order (business use-case), we must extract information from the request body (infrastructure), then apply some format validation in order to work on consistent data (infrastructure), then calculate prices and discounts (business) and finally send the appropriate HTTP code (infrastructure).

## Dealing with the consequences

### No code reuse

Codebase does not scale and is error-prone.

*Example:*

The piece of code below contains the error mapping logic and is repeated twice (line 85 and 126). Duplicating this code each time we want the appropriate error message means that modifications have to be made at several locations in our code, implying more occasions to forget things or make mistakes.

```js
const errorMessage = error.details.map(({ message, context }) =>
  Object.assign({ message, context })
);
```

---

### Heavy cognitive load

One has to keep many things in mind to comprehend how code works at the very top level of our application. Plus, the code lacks expressiveness due to technical details hiding developers and business intentions.

*Example:*

How does one know how to create an order? Well looking at the code we can see this:

```js
const { error } = Joi.validate(req.body, orderSchema, {
  abortEarly: false
});

if (error) {
  const errorMessage = error.details.map(({ message, context }) =>
    Object.assign({ message, context })
  );
  return res.status(400).send({ data: errorMessage });
}

const productList = await Product.findAll({
  where: {
    id: { [Op.in]: req.body.product_list.map(id => parseInt(id, 0)) }
  }
});

if (productList.length === 0) {
  return res.status(400).send({
    data: [
      { message: "Unknown products", context: { key: "product_list" } }
    ]
  });
}

const productListData = productList.map(product => product.toJSON());

const orderTotalWeight = productListData
  .map(p => p.weight)
  .reduce((prev, cur) => prev + cur, 0);

const orderProductListPrice = productListData
  .map(p => p.price)
  .reduce((prev, cur) => prev + cur, 0);

const SHIPMENT_PRICE_STEP = 25;
const SHIPMENT_WEIGHT_STEP = 10;
const orderShipmentPrice =
  SHIPMENT_PRICE_STEP * Math.round(orderTotalWeight / SHIPMENT_WEIGHT_STEP);

let totalAmount = orderProductListPrice + orderShipmentPrice;
if (totalAmount > 1000) {
  totalAmount = totalAmount * 0.95;
}

const orderData = Object.assign(
  {
    total_amount: totalAmount,
    shipment_amount: orderShipmentPrice,
    total_weight: orderTotalWeight
  },
  { product_list: req.body.product_list }
);

const order = await Order.create(orderData);
res.set("Location", `/orders/${order.id}`);
res.status(201).send();
```

This anonymous function is 50 lines long and seems to do many things. However, what creating an order really boils down to is (from both technical and business perspectives):
* validate what comes in the API
* send error in case of errors
* retrieve the product list from the order
* calculate the shipment price, total weight and amount
* save the order in the database
* return the appropriate HTTP code

---

### Side-effects everywhere

We hit all the technical layers within the single layer our application offers.

---

### No way to test at the unit level

We have no way to extract specific parts of our application. This leads to inappropriate test practices made of longer feedback loop (because tests will take more time to execute) and a blackbox approach (aka spaghetti code) since we can't drive our implementation with tests and make it - de facto - modular.

---
  
### Functional tests take time to run

Our functional test suite hits both network and database layers, this means four (de)serializations steps plus the database delay.

If we consider that making a read operation on our database takes 50ms and a write operation takes 100ms, the test suite will take 22s (see a877fc) to execute which is awfully long for a feedback loop. And that's just on our 200 lines application.


## Notes to incorporate


Publishing npm packages does not solve the orchestration issues.

Create abstractions: increase global complexity while lowering local ones


## What solution(s) do we have?

Despite its flaws, our code base still has many qualities which will help us refactor it:
* relatively short (200 lines)
* loose structure
* well tested

our code base is simple (200 lines long), tested and not structured.

Modules with a single purpose.

## Instructions

### Start

Server will listen on port `3000` by default (can be overriden with environment variable `PORT`)
```sh
$ npm start
```


### Test

```sh
$ npm test
```


### Lint

```sh
$ npm run lint
```

## License

[MIT License](https://opensource.org/licenses/MIT)

Copyright (c) 2017-2017 Simon Renoult.
