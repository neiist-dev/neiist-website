const { createAreas } = require('./areasQueries');
const { createTheses } = require('./thesesQueries');
const { createMembers } = require('./membersQueries');
const { createElections, createOptions } = require('./electionsQueries');
const { createVotes } = require('./votesQueries');

const initializeSchema = async () => {
  await createAreas();
  await createTheses();
  await createMembers();
  await createElections();
  await createOptions();
  await createVotes();
};

module.exports = {
  initializeSchema,
};
