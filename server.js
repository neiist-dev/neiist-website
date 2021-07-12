const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const auth = require('./routes/authRoute')
const theses = require('./routes/thesesRoute')
const areas = require('./routes/areasRoute')
const members = require('./routes/membersRoute')
const elections = require('./routes/electionsRoute')
const votes = require('./routes/votesRoute')

const app = express()
app.use(cors())
app.use(express.static(path.join(__dirname, 'client/build')))

app.use('/auth', auth)
app.use('/theses', theses)
app.use('/areas', areas)
app.use('/members', members)
app.use('/elections', elections)
app.use('/votes', votes)

const port = process.env.PORT || 5000;
app.listen(port, () =>
  console.log(`App is listening on port ${port}.`)
)