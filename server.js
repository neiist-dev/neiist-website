const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const auth = require('./routes/auth')
const theses = require('./routes/theses')
const areas = require('./routes/areas')
const members = require('./routes/members')

const app = express()
app.use(cors())
app.use(express.static(path.join(__dirname, 'client/build')))

app.use('/auth', auth)
app.use('/theses', theses)
app.use('/areas', areas)
app.use('/members', members)


const port = process.env.PORT || 5000;
app.listen(port, () =>
    console.log(`App is listening on port ${port}.`)
)