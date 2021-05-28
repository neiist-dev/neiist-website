const axios = require('axios')

const getPersonInformation = async code => {
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

        var personInformationResponse = await axios.get(
            'https://fenix.tecnico.ulisboa.pt/api/fenix/v1/person' +
            `?access_token=${accessTokenResponse.data.access_token}`
        )

        if (personInformationResponse === undefined || personInformationResponse.status != 200)
            return console.log('personInformationResponse is undefined or the status is not 200')
    } catch (error) {
        return console.log(error)
    }

    return personInformationResponse.data
}

module.exports = {
    getPersonInformation: getPersonInformation,
}