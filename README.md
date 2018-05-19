# Node.js: beyond the route layer

> A discussion on how Node.js projects can be organized.


<a href="https://travis-ci.org/simonrenoult/nodejs-application-architecture">
  <img alt="Travis" src="https://img.shields.io/travis/simonrenoult/nodejs-application-architecture.svg?style=flat-square">
</a>
<a href="https://codecov.io/gh/simonrenoult/nodejs-application-architecture">
  <img alt="Codecov" src="https://img.shields.io/codecov/c/github/simonrenoult/nodejs-application-architecture.svg?style=flat-square">
</a>
<a href="https://travis-ci.org/simonrenoult/nodejs-application-architecture">
  <img alt="Travis" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square">
</a>

## Discussion

The artcle discussing this code base is here: https://blog.octo.com/en/clean-node-part-1/. Feel free to open an issue in order to discuss design decisions!


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


## Instructions

### Start

Server will listen on port `3000` by default (can be overridden with environment variable `PORT`)
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
