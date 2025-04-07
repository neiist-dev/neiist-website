import { Collaborator } from "./dto";
import { collaboratorsRepository } from "./repository";

const checkCurrentCollab = async (username: string) => {
  const collabInfo = await collaboratorsRepository.getCurrentCollab(username);
  return collabInfo;
}

const checkAdmin = async (username: string) => {
  const collabInfo = await collaboratorsRepository.checkAdmin(username);
  return collabInfo;
}

const checkCoordenator = async (username: string) => {
  const collabInfo = await collaboratorsRepository.checkCoordenator(username);
  return collabInfo;
}

const checkGACMember = async (username: string) => {
  const collabInfo = await collaboratorsRepository.checkGACMember(username);
  return collabInfo;
}

const getCurrentCollabs = async () => {
  const collabInfo = await collaboratorsRepository.getCurrentCollabs();
  return collabInfo;
};

const getCurrentCollabsResume = async () => {
  const collabInfo = await collaboratorsRepository.getCurrentCollabsResume();
  return collabInfo;
};

const getCollabTeams = async (username: string) => {
  const collabInfo = await checkCurrentCollab(username);

  const teams = collabInfo?.teams?.replace("COOR-","")?.split(",") || [];
  const teamMembers = await collaboratorsRepository.getCurrentTeamMembers(teams);

  return {teams: collabInfo?.teams, teamMembers: teamMembers};
}

const addNewCollab = async (username: string, newCollabInfo: Collaborator) => 
  await collaboratorsRepository.addCollaborator(username, newCollabInfo);

const removeCollab = async (username: string) => 
  await collaboratorsRepository.removeCollaborator(username);

export const collaboratorsService = {
  checkCurrentCollab,
  checkAdmin,
  checkGACMember,
  checkCoordenator,
  getCurrentCollabs,
  getCurrentCollabsResume,
  getCollabTeams,
  addNewCollab,
  removeCollab,
};
