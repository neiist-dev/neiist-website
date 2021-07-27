const db = require('../db/votesQueries');

const newVote = async (vote) => {
  await db.createVote(vote);
};

const getResults = async (electionId) => {
  const results = await db.getResults(electionId);
  return results;
};

module.exports = {
  newVote,
  getResults,
};
