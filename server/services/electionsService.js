const db = require('../db/electionsQueries');

const getElections = async () => {
  const elections = await db.getElections();
  return elections;
};

const getActiveUnvotedElections = async (username) => {
  const activeUnvotedElections = await db.getActiveUnvotedElections(username);
  return activeUnvotedElections;
};

const newElection = async (election) => {
  const { id } = await db.createElection(election);
  election.options.forEach((optionName) => db.addOption(optionName, id));
};

const getOptions = async (id) => {
  const options = await db.getOptions(id);
  return options;
};

module.exports = {
  getElections,
  getActiveUnvotedElections,
  newElection,
  getOptions,
};
