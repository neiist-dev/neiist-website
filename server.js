const express = require('express')
const cors = require('cors')
const axios = require('axios')
const path = require('path')
require('dotenv').config()

const theses = require('./data/meic_theses.json')
const areas = require('./data/meic_areas.json')

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'client/build'))) //https://github.com/hemakshis/Basic-MERN-Stack-App/blob/master/app.js

app.get('/auth', async (req, res) => {
    try {
        var accessTokenResponse = await axios.post(
            'https://fenix.tecnico.ulisboa.pt/oauth/access_token' +
            `?client_id=${process.env.FENIX_CLIENT_ID}` +
            `&client_secret=${encodeURIComponent(process.env.FENIX_CLIENT_SECRET)}` +
            `&redirect_uri=${process.env.FENIX_REDIRECT_URI}` +
            `&code=${encodeURIComponent(req.query.code)}` +
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

    res.send(personInformationResponse.data)
})

app.get('/theses/:area1?/:area2?', (req, res) => {
    const area1 = req.params.area1
    const area2 = req.params.area2

    const checkedAreas = []
    if (area1 !== undefined) checkedAreas.push(area1)
    if (area2 !== undefined) checkedAreas.push(area2)

    res.json(theses.filter(thesis => checkedAreas.every(area => thesis.areas.includes(area))))
})

app.get('/thesis/:id', (req, res) =>
    res.json(theses.find(thesis => thesis.id === req.params.id))
)

app.get('/areas', (req, res) =>
    res.json(areas)
)

app.listen(5000, () =>
    console.log('App is running on port 5000.')
)