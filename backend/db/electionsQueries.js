const db = require('./db')

const getElections = async () => {
  try {
    const elections = await db.query("SELECT * FROM elections")
    return elections.rows
  }
  catch (err) {
    console.error(err)
  }
}

const createElection = async election => {
  try {
    const createdElection = await db.query('INSERT INTO elections(name, "startDate", "endDate") VALUES($1, $2, $3) RETURNING *', [election.name, election.startDate, election.endDate])
    return createdElection.rows[0]
  }
  catch (err) {
    console.error(err)
  }
}

const addOption = async (optionName, electionId) => {
  try {
    db.query('INSERT INTO options(name, "electionId") VALUES($1, $2)', [optionName, electionId])
  }
  catch (err) {
    console.error(err)
  }
}

const getOptions = async electionId => {
  try {
    const options = await db.query('SELECT * FROM options WHERE "electionId"=$1', [electionId])
    return options.rows
  }
  catch (err) {
    console.error(err)
  }
}

module.exports = {
  getElections: getElections,
  createElection: createElection,
  addOption: addOption,
  getOptions: getOptions
}
