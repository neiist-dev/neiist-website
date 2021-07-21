const path = require('path')
require('dotenv').config({
    path: path.resolve(__dirname, `../config/.env.${process.env.NODE_ENV}`)
});

const { createTableAreas } = require('./areasQueries')
const { createTableTheses } = require('./thesesQueries')
const { createTableMembers } = require('./membersQueries')
const { createTableElections, createTableOptions } = require('./electionsQueries')
const { createTableVotes } = require('./votesQueries')

const createTables = async () => {
    await createTableAreas()
    await createTableTheses()
    await createTableMembers()
    await createTableElections()
    await createTableOptions()
    await createTableVotes()
}

createTables();