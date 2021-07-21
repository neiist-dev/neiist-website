const db = require('./db')

const createTableElections = async () => {
  const client = await db.getClient()
  try {
    await client.query("BEGIN")
    await client.query("DROP TABLE IF EXISTS elections CASCADE")
    await client.query(
      `CREATE TABLE elections(
                id serial PRIMARY KEY,
                name varchar(100),
                "startDate" date,
                "endDate" date

            )`
    )
    await client.query("COMMIT")
  }
  catch (err) {
    await client.query("ROLLBACK")
    console.error(err)
  }
  finally {
    client.release()
  }
}

const createTableOptions = async () => {
  const client = await db.getClient()
  try {
    await client.query("BEGIN")
    await client.query("DROP TABLE IF EXISTS options CASCADE")
    await client.query(
      `CREATE TABLE options(
                id serial PRIMARY KEY,
                name varchar(100),
                "electionId" INTEGER REFERENCES elections(id) ON DELETE CASCADE ON UPDATE CASCADE
            )`
    )
    await client.query("COMMIT")
  }
  catch (err) {
    await client.query("ROLLBACK")
    console.error(err)
  }
  finally {
    client.release()
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
  createTableElections: createTableElections,
  createTableOptions: createTableOptions,
  getElections: getElections,
  createElection: createElection,
  addOption: addOption,
  getOptions: getOptions
}
