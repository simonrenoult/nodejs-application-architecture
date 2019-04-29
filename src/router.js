function router(services) {
  return { dispatch };

  function dispatch(app) {
    app.post("/products", services.product.create);
    app.get("/products", services.product.list);
    app.get("/products/:id", services.product.show);
    app.delete("/products", services.product.deleteAll);

    app.post("/orders", services.order.create);
    app.get("/orders", services.order.list);
    app.get("/orders/:id", services.order.show);
    app.delete("/orders", services.order.deleteAll);
    app.put("/orders/:id/status", services.order.updateStatus);

    app.get("/bills", services.bill.list);
    app.delete("/bills", services.bill.deleteAll);
  }
}

module.exports = router;
