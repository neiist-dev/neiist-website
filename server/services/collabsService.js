const { collabsDatabase } = require('../database');

const checkCurrentCollab = async (username) => {
  const collabInfo = await collabsDatabase.getCurrentCollab(username);
  return collabInfo ? collabInfo : null;
}

const checkAdmin = async (username) => {
  const collabInfo = await collabsDatabase.checkAdmin(username);
  return collabInfo;
}

const checkGACMember = async (username) => {
  const collabInfo = await collabsDatabase.checkGACMember(username);
  return collabInfo;
}

const getCurrentCollabs = async () => {
  const collabInfo = await collabsDatabase.getCurrentCollabs();
  return collabInfo ? collabInfo : null;
};

const getCollabTeams = async (username) => {
  const collabInfo = await checkCurrentCollab(username);

  const teams = collabInfo.teams.replace("COOR-","").split(",");
  const teamMembers = await collabsDatabase.getCurrentTeamMembers(teams);

  return {teams: collabInfo.teams, teamMembers: teamMembers};
}

const addNewCollab = async (username,newCollabInfo) => 
  await collabsDatabase.addCollaborator(username, newCollabInfo);

const removeCollab = async (username) => 
  await collabsDatabase.removeCollaborator(username);

module.exports = {
  checkCurrentCollab,
  checkAdmin,
  checkGACMember,
  getCurrentCollabs,
  getCollabTeams,
  addNewCollab,
  removeCollab,
};
