const axios = require('axios')

const getUserData = async code => {
    const accessToken = await getAccessToken(code)
    const personInformation = await getPersonInformation(accessToken)
    const userData = {
        displayName: personInformation.displayName,
        isAuthorized: isAuthorized()
    }
    return userData
}

const getAccessToken = async code => {
    try {
        var accessTokenResponse = await axios.post(
            'https://fenix.tecnico.ulisboa.pt/oauth/access_token' +
            `?client_id=${process.env.FENIX_CLIENT_ID}` +
            `&client_secret=${encodeURIComponent(process.env.FENIX_CLIENT_SECRET)}` +
            `&redirect_uri=${process.env.FENIX_REDIRECT_URI}` +
            `&code=${encodeURIComponent(code)}` +
            '&grant_type=authorization_code'
        )

        if (accessTokenResponse === undefined || accessTokenResponse.status != 200)
            return console.log('accessTokenResponse is undefined or the status is not 200')

        return accessTokenResponse.data.access_token
        
    } catch (error) {
        return console.log(error)
    }
}

const getPersonInformation = async accessToken => {
    try {
        var personInformationResponse = await axios.get(
            'https://fenix.tecnico.ulisboa.pt/api/fenix/v1/person' +
            `?access_token=${accessToken}`
        )

        if (personInformationResponse === undefined || personInformationResponse.status != 200)
            return console.log('personInformationResponse is undefined or the status is not 200')

        return personInformationResponse.data

    } catch (error) {
        return console.log(error)
    }
}

const isAuthorized = () => {
    return true // FIXME
}

module.exports = {
    getUserData: getUserData,
}