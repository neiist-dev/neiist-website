const { electionsDatabase } = require('../database');

const newElection = async (election) => {
  await electionsDatabase.createElection(election);
};

const getActiveElections = async () => {
  const currDate = new Date();
  const elections = await electionsDatabase.getActiveElections(currDate);
  return elections;
};

const getAllElections = async () => {
  const elections = await electionsDatabase.getAllElections();
  return elections;
};

const newVote = async (id, vote) => {
  await electionsDatabase.createVote(id, vote);
};

module.exports = {
  newElection,
  getActiveElections,
  getAllElections,
  newVote,
};
