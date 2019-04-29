const Joi = require("joi");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

function services(models, schemas) {
  return {
    create: createOrder,
    list: listOrder,
    show: showOrder,
    deleteAll: deleteOrders,
    updateStatus: updateOrderStatus
  };

  async function createOrder(req, res) {
    // HTTP request payload validation
    // abortEarly is false in order to retrieve all the errors at once
    const { error } = Joi.validate(req.body, schemas.order, {
      abortEarly: false
    });

    if (error) {
      const errorMessage = error.details.map(({ message, context }) =>
        Object.assign({ message, context })
      );
      return res.status(400).send({ data: errorMessage });
    }

    // Fetch the list of products based on the products provided in the order
    const productList = await models.product.findAll({
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

    // Compute the total weight order
    const orderTotalWeight = productListData
      .map(p => p.weight)
      .reduce((prev, cur) => prev + cur, 0);

    // Compute the total price amount
    const orderProductListPrice = productListData
      .map(p => p.price)
      .reduce((prev, cur) => prev + cur, 0);

    // Compute the shipment price amount
    const SHIPMENT_PRICE_STEP = 25;
    const SHIPMENT_WEIGHT_STEP = 10;
    const orderShipmentPrice =
      SHIPMENT_PRICE_STEP * Math.round(orderTotalWeight / SHIPMENT_WEIGHT_STEP);

    // Compute the order price
    let totalAmount = orderProductListPrice + orderShipmentPrice;

    // Compute the discount
    const DISCOUNT_THRESHOLD = 1000;
    const DISCOUNT_RATIO = 0.95;
    if (totalAmount > DISCOUNT_THRESHOLD) {
      totalAmount = totalAmount * DISCOUNT_RATIO;
    }

    const orderData = Object.assign(
      {
        total_amount: totalAmount,
        shipment_amount: orderShipmentPrice,
        total_weight: orderTotalWeight
      },
      { product_list: req.body.product_list }
    );

    const order = await models.order.create(orderData);
    res.set("Location", `/orders/${order.id}`);
    res.status(201).send();
  }

  async function listOrder(req, res) {
    let orderList = await models.order.findAll();
    const { sort } = req.query;
    orderList = orderList.sort((a, b) => {
      if (a[sort] < b[sort]) return -1;
      if (a[sort] > b[sort]) return 1;
      return 0;
    });
    res.status(200).json(orderList);
  }

  async function showOrder(req, res) {
    const { id } = req.params;
    const order = await models.order.findByPk(id);
    if (!order) return res.status(404).send();
    return res.status(200).json(order.toJSON());
  }

  async function deleteOrders(req, res) {
    const orderList = await models.order.findAll();
    orderList.forEach(order => order.destroy());
    res.status(204).send();
  }

  async function updateOrderStatus(req, res) {
    const { id } = req.params;
    const order = await models.order.findByPk(id);
    if (!order) return res.status(404).send();

    const { status } = req.body;
    if (!["pending", "paid", "cancelled"].includes(status)) {
      return res.status(400).send();
    }

    if (status === "paid") {
      models.bill.create({ total_amount: order.toJSON().total_amount });
    }

    await order.update({ status });

    return res.status(200).send();
  }
}

module.exports = services;
