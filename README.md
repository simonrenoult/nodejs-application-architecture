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

The `index.js` file does everything:
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
  
What's more, all the business and infrastructure logic depend on each other. For instance, in order to create an order (business use-case), we must extract information from the request body (infrastructure), then apply some format validation in order to work on consistent data (infrastructure), then calculate prices and discounts (business) and finally send the appropriate HTTP code (infrastructure).
  
These design flaws have consequences:
  * no code reuse: codebase does not scale and is error-prone
  * cognitive load is heavy: one has to keep lots of things in mind to comprehend how things work at the very top level of our application
  * code is a big blob of side-effects: we hit all the technical layers within the single layer our application offers
  * code lacks expressiveness: we have to go through technical details in order to understand what some part of the code do
  * code cannot be tested at the unit level: we have no way to extract specific parts of our application. This leads to inappropriate test practices made of longer feedback loop (because tests will take more time to execute) and a blackbox approach (aka spaghetti code) since we can't drive our implementation with tests.
  * current tests can take a long time to run since they all hit the network and database layers: if we consider that making a read operation on our database takes 50ms and a write operation takes 100ms, the test suite will take 22s to execute which is awfully long for a feedback loop. And that's just on our 200 lines application.
  
What solution do we have?
  * modules with a single purpose
    
  
## License

[MIT License](https://opensource.org/licenses/MIT)

Copyright (c) 2017-2017 Simon Renoult.
