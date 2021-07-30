const { electionsDatabase } = require('../database');

const newElection = async (election) => {
  await electionsDatabase.createElection(election);
};

const getElections = async () => {
  const elections = await electionsDatabase.getElections();
  return elections;
};

const newVote = async (id, vote) => {
  await electionsDatabase.createVote(id, vote);
};

module.exports = {
  newElection,
  getElections,
  newVote,
};
