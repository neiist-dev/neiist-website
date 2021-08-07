const axios = require('axios');

const getAccessToken = async (code) => {
  try {
    const accessTokenResponse = await axios.post(
      'https://fenix.tecnico.ulisboa.pt/oauth/access_token'
      + `?client_id=${process.env.FENIX_CLIENT_ID}`
      + `&client_secret=${encodeURIComponent(process.env.FENIX_CLIENT_SECRET)}`
      + `&redirect_uri=${process.env.FENIX_REDIRECT_URI}`
      + `&code=${encodeURIComponent(code)}`
      + '&grant_type=authorization_code',
    );

    if (accessTokenResponse === undefined || accessTokenResponse.status !== 200) { return console.error('accessTokenResponse is undefined or the status is not 200'); }

    return accessTokenResponse.data.access_token;
  } catch (error) {
    return console.error(error);
  }
};

const getPersonInformation = async (accessToken) => {
  try {
    const personInformationResponse = await axios.get(
      'https://fenix.tecnico.ulisboa.pt/api/fenix/v1/person'
      + `?access_token=${accessToken}`,
    );

    if (personInformationResponse === undefined || personInformationResponse.status !== 200) { return console.error('personInformationResponse is undefined or the status is not 200'); }

    return personInformationResponse.data;
  } catch (error) {
    return console.error(error);
  }
};

const isAcceptedRole = (role) => {
  const acceptedTypes = [
    'STUDENT',
    'TEACHER',
  ];

  return acceptedTypes.includes(role.type);
};

const isNonAdmin = (roles) => roles.some((role) => isAcceptedRole(role));

const isAdmin = (username) => {
  const adminUsernames = process.env.ADMIN_USERNAMES.split(',');
  return adminUsernames.includes(username);
};

const getUserData = async (accessToken) => {
  const personInformation = await getPersonInformation(accessToken);

  const userData = {
    username: personInformation.username,
    displayName: personInformation.displayName,
    isNonAdmin: isNonAdmin(personInformation.roles),
    isAdmin: isAdmin(personInformation.username),
  };

  return userData;
};

module.exports = {
  getAccessToken,
  getUserData,
};
