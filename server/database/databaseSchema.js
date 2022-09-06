const { createAreas } = require('./areasDatabase');
const { createTheses } = require('./thesesDatabase');
const { createMembers } = require('./membersDatabase');
const { createElections, createOptions, createVotes } = require('./electionsDatabase');
const { createProducts, createOrders, createOrderContents } = require('./productsDatabase');

const initializeSchema = async () => {
  await createAreas();
  await createTheses();
  await createMembers();
  await createElections();
  await createOptions();
  await createVotes();
  await createProducts();
  await createOrders();
  await createOrderContents();
};

module.exports = {
  initializeSchema,
};
