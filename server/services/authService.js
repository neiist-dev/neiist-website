const axios = require("axios");
const {
  checkCurrentCollab,
  checkAdmin,
  checkGACMember,
  checkCoordenator,
} = require("./collabsService");
const { getMember } = require("./membersService");

const getAccessToken = async (code) => {
  try {
    const accessTokenResponse = await axios.post(
      "https://fenix.tecnico.ulisboa.pt/oauth/access_token" +
        `?client_id=${process.env.FENIX_CLIENT_ID}` +
        `&client_secret=${encodeURIComponent(
          process.env.FENIX_CLIENT_SECRET
        )}` +
        `&redirect_uri=${process.env.FENIX_REDIRECT_URI}` +
        `&code=${encodeURIComponent(code)}` +
        "&grant_type=authorization_code"
    );

    if (
      accessTokenResponse === undefined ||
      accessTokenResponse.status !== 200
    ) {
      return console.error(
        "accessTokenResponse is undefined or the status is not 200"
      );
    }

    return accessTokenResponse.data.access_token;
  } catch (error) {
    return console.error(error);
  }
};

const getPersonInformation = async (accessToken) => {
  try {
    const personInformationResponse = await axios.get(
      "https://fenix.tecnico.ulisboa.pt/api/fenix/v1/person" +
        `?access_token=${accessToken}`
    );

    if (
      personInformationResponse === undefined ||
      personInformationResponse.status !== 200
    ) {
      return console.error(
        "personInformationResponse is undefined or the status is not 200"
      );
    }

    return personInformationResponse.data;
  } catch (error) {
    throw new Error(error.response.data.error);
  }
};

const isActiveTecnicoStudent = (roles) =>
  roles.some((role) => role.type === "STUDENT");

const isActiveLMeicStudent = (roles) => {
  const LMeicAcronyms = ["LEIC-A", "LEIC-T", "MEIC-A", "MEIC-T"];

  return roles.some(
    (role) =>
      role.type === "STUDENT" &&
      role.registrations.some((registration) =>
        LMeicAcronyms.includes(registration.acronym)
      )
  );
};

const isGacMember = async (username) => {
  // GAC = general assembly committee (MAG in PT)
  const gacMembers = await checkGACMember(username);
  const gacUsernames = process.env.GAC_USERNAMES.split(",");
  return gacUsernames.includes(username) || gacMembers;
};

const isCoordenator = async (username) => {
  const isCoordenator = await checkCoordenator(username);
  return isCoordenator;
};

const isAdmin = async (username) => {
  const adminCollabs = await checkAdmin(username);
  const adminUsernames = process.env.ADMIN_USERNAMES.split(",");
  return adminUsernames.includes(username) || adminCollabs;
};

const isCollab = async (username) => {
  const collab = await checkCurrentCollab(username);
  return collab ? collab : false;
};

const getAcronyms = (data) => {
  var acronyms = [];
  data.roles.forEach((role) => {
    if (role.type === "STUDENT")
      role.registrations.forEach((registration) =>
        acronyms.push(registration.acronym)
      );
  });
  return acronyms.join();
};

const getUserData = async (accessToken) => {
  try {
    const personInformation = await getPersonInformation(accessToken);
    const acronyms = getAcronyms(personInformation);
    const member = await getMember(personInformation.username);
    const isMember = (member) => (member ? true : false);

    const userData = {
      username: personInformation.username,
      displayName: personInformation.displayName,
      name: personInformation.name,
      email: personInformation.institutionalEmail,
      courses: acronyms,
      status: member ? member.status : "NaoSocio",
      isActiveTecnicoStudent: isActiveTecnicoStudent(personInformation.roles),
      isActiveLMeicStudent: isActiveLMeicStudent(personInformation.roles),
      isAdmin: await isAdmin(personInformation.username),
      isGacMember: await isGacMember(personInformation.username),
      isMember: await isMember(member),
      isCollab: await isCollab(personInformation.username),
      isCoordenator: await isCoordenator(personInformation.username),
    };
    return userData;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getAccessToken,
  getUserData,
};
