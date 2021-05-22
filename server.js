const express = require('express')
const cors = require('cors')
const axios = require('axios')
const path = require('path')
require('dotenv').config()

const theses = require('./data/meic_theses.json')
const areas = require('./data/meic_areas.json')

//TODO: encapsulate Pool in a module
const { Pool } = require('pg');
const { prototype } = require('events')

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    password: '0000',
    port: 5432,
    database: 'neiistdb',
});


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
//This was left here for debugging purposes
// app.get('/theses/:area1?/:area2?', (req, res) => {
//     const area1 = req.params.area1
//     const area2 = req.params.area2

//     const checkedAreas = []
//     if (area1 !== undefined) checkedAreas.push(area1)
//     if (area2 !== undefined) checkedAreas.push(area2)

//     res.json(theses.filter(thesis => checkedAreas.every(area => thesis.areas.includes(area))))
// })

// app.get('/thesis/:id', (req, res) =>
//     res.json(theses.find(thesis => thesis.id === req.params.id))
// )

// app.get('/areas', (req, res) => {
//     res.json(areas)
// })

app.get("/areas", async(req, res) => {
    try {
        const allAreas = await pool.query("select * from areas");
        res.json(allAreas.rows);
    }
    catch(err) {
        console.error(err.message);
    }
})

app.get('/thesis/:id', async(req, res) => {
    const {id} = req.params
    try {
        const thesis = await pool.query("select * from theses where id = $1", [id]);
        res.json(thesis.rows[0]);
    }
    catch(err) {
        console.error(err.message);
    }
})

app.get('/theses/:area1?/:area2?', async(req, res) => {
    const area1 = req.params.area1
    const area2 = req.params.area2

    try {
        let theses
        if(area1 !== undefined && area2 !== undefined)
            theses = await pool.query("select * from theses where area1 = $1 or area2 = $1 or area1 = $2 or area2 = $2", [area1, area2]);
        else if(area1 !== undefined) theses = await pool.query("select * from theses where area1 = $1 or area2 = $1", [area1]);
        else if(area2 !== undefined) theses = await pool.query("select * from theses where area1 = $1 or area2 = $1", [area2]);
        else theses = await pool.query("select * from theses");

        res.json(theses.rows);
    }
    catch (err) {
        console.error(err.message);
    }
})


app.listen(5000, () =>
    console.log('App is running on port 5000.')
)