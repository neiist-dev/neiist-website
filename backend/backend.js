const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config({
  path: path.resolve(__dirname, `config/.env.${process.env.NODE_ENV}`)
});

const auth = require('./routes/authRoute')
const theses = require('./routes/thesesRoute')
const areas = require('./routes/areasRoute')
const members = require('./routes/membersRoute')
const elections = require('./routes/electionsRoute')
const votes = require('./routes/votesRoute')

const app = express()
app.use(cors())

// serve frontend
app.use(express.static(path.join(__dirname, '../frontend/build')))

app.use('/api/auth', auth)
app.use('/api/theses', theses)
app.use('/api/areas', areas)
app.use('/api/members', members)
app.use('/api/elections', elections)
app.use('/api/votes', votes)

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`App is listening on port ${port} in ${process.env.NODE_ENV} mode.`)
})