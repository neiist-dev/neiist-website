const { createAreas } = require('./areasDatabase');
const { createTheses } = require('./thesesDatabase');
const { createMembers } = require('./membersDatabase');
const { createCollaborators, createCurrentCollabView } = require('./collabsDatabase');
const { createElections, createOptions, createVotes } = require('./electionsDatabase');

const initializeSchema = async () => {
  await createAreas();
  await createTheses();
  await createMembers();
  await createCollaborators();
  await createCurrentCollabView();
  await createElections();
  await createOptions();
  await createVotes();
};

module.exports = {
  initializeSchema,
};
