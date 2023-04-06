const { createAreas } = require('./areasDatabase');
const { createTheses } = require('./thesesDatabase');
const { createMembers, createRenewalNotifications } = require('./membersDatabase');
const {
  createCollaborators,
  createCurrentCollabView,
  createAdminsView,
  createGACMembersView,
  createCoordenatorsView
} = require('./collabsDatabase');
const { createElections, createOptions, createVotes } = require('./electionsDatabase');

const initializeSchema = async () => {
  await createAreas();
  await createTheses();
  await createMembers();
  await createCollaborators();
  await createCurrentCollabView();
  await createCoordenatorsView();
  await createGACMembersView();
  await createRenewalNotifications();
  await createAdminsView();
  await createElections();
  await createOptions();
  await createVotes();
};

module.exports = {
  initializeSchema,
};
