const Pool = require('pg').Pool
const pool = new Pool()

const createTables = async () => {
  await createTableAreas()
  await createTableTheses()
  await createTableMembers()
  await createTableElections()
  await createTableOptions()
  await createTableVotes()
}

const createTableAreas = async () => {
  const client = await pool.connect()
  try {
    await client.query("DROP TABLE IF EXISTS areas CASCADE")
    await client.query(
      `CREATE TABLE areas(
                code varchar(10) PRIMARY KEY,
                short varchar(10),
                long varchar(100)
            )`
    )
  }
  catch (err) {
    console.error(err.stack)
  }
  finally {
    client.release()
  }
}

const createTableTheses = async () => {
  const client = await pool.connect()
  try {
    await client.query("DROP TABLE IF EXISTS theses CASCADE")
    await client.query(
      `CREATE TABLE theses(
                id integer PRIMARY KEY,
                title text,
                supervisors text[],
                vacancies integer,
                location text,
                observations text,
                objectives text,
                requirements text,
                area1 varchar(10) REFERENCES areas(code) ON DELETE CASCADE ON UPDATE CASCADE,
                area2 varchar(10) REFERENCES areas(code) ON DELETE CASCADE ON UPDATE CASCADE
            )`
    )
  }
  catch (err) {
    console.error(err.stack)
  }
  finally {
    client.release()
  }
}

const createTableMembers = async () => {
  const client = await pool.connect()
  try {
    await client.query("DROP TABLE IF EXISTS members CASCADE")
    await client.query(
      `CREATE TABLE members(
                username varchar(9) PRIMARY KEY,
                "registerDate" date,
                "canvoteDate" date
            )`
    )
  }
  catch (err) {
    console.error(err.stack)
  }
  finally {
    client.release()
  }
}

const createTableElections = async () => {
  const client = await pool.connect()
  try {
    await client.query("DROP TABLE IF EXISTS elections CASCADE")
    await client.query(
      `CREATE TABLE elections(
                id serial PRIMARY KEY,
                name varchar(100),
                "startDate" date,
                "endDate" date

            )`
    )
  }
  catch (err) {
    console.error(err.stack)
  }
  finally {
    client.release()
  }
}

const createTableOptions = async () => {
  const client = await pool.connect()
  try {
    await client.query("DROP TABLE IF EXISTS options CASCADE")
    await client.query(
      `CREATE TABLE options(
                id serial PRIMARY KEY,
                name varchar(100),
                "electionId" INTEGER REFERENCES elections(id) ON DELETE CASCADE ON UPDATE CASCADE
            )`
    )
  }
  catch (err) {
    console.error(err.stack)
  }
  finally {
    client.release()
  }
}

const createTableVotes = async () => {
  const client = await pool.connect()
  try {
    await client.query("DROP TABLE IF EXISTS votes CASCADE")
    await client.query(
      `CREATE TABLE votes(
                username varchar(9),
                "electionId" INTEGER REFERENCES elections(id) ON DELETE CASCADE ON UPDATE CASCADE,
                "optionId" INTEGER REFERENCES options(id) ON DELETE CASCADE ON UPDATE CASCADE,
                PRIMARY KEY (username, "electionId")
            )`
    )
  }
  catch (err) {
    console.error(err.stack)
  }
  finally {
    client.release()
  }
}

module.exports = {
  createTables: createTables
}