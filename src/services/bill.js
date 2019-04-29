function services(models) {
  return {
    list: listBills,
    deleteAll: deleteBills
  };

  async function listBills(req, res) {
    let billList = await models.bill.findAll();
    res.status(200).json(billList);
  }

  async function deleteBills(req, res) {
    const billList = await models.bill.findAll();
    billList.forEach(bill => bill.destroy());
    res.status(204).send();
  }
}

module.exports = services;
