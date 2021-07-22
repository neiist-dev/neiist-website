const db = require('./db')

const createElections = async () => {
  try {
    await db.query(
      `CREATE TABLE elections(
                id serial PRIMARY KEY,
                name varchar(100),
                "startDate" date,
                "endDate" date

            )`
    )
  }
  catch (err) {
    if (err.code === '42P07')
      ; // table already exists
    else
      console.error(err)
  }
}

const createOptions = async () => {
  try {
    await db.query(
      `CREATE TABLE options(
                id serial PRIMARY KEY,
                name varchar(100),
                "electionId" INTEGER REFERENCES elections(id) ON DELETE CASCADE ON UPDATE CASCADE
            )`
    )
  }
  catch (err) {
    if (err.code === '42P07')
      ; // table already exists
    else
      console.error(err)
  }
}

const getElections = async () => {
  try {
    const elections = await db.query("SELECT * FROM elections")
    return elections.rows
  }
  catch (err) {
    console.error(err)
  }
}

const getActiveUnvotedElections = async (username) => {
  try {
    const today = new Date()
    const elections = await db.query(
      `SELECT *
            FROM elections
            WHERE "startDate" <= $1
              and $1 <= "endDate"
              and id NOT IN (
                  SELECT "electionId"
                  FROM votes
                  WHERE username=$2
              ) `
      , [today, username]
    )
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
  createElections: createElections,
  createOptions: createOptions,
  getElections: getElections,
  getActiveUnvotedElections: getActiveUnvotedElections,
  createElection: createElection,
  addOption: addOption,
  getOptions: getOptions
}
