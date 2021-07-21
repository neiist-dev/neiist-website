const db = require('./db')

const createTableVotes = async () => {
  const client = await db.getClient()
  try {
    await client.query("BEGIN")
    await client.query("DROP TABLE IF EXISTS votes CASCADE")
    await client.query(
      `CREATE TABLE votes(
                username varchar(9),
                "electionId" INTEGER REFERENCES elections(id) ON DELETE CASCADE ON UPDATE CASCADE,
                "optionId" INTEGER REFERENCES options(id) ON DELETE CASCADE ON UPDATE CASCADE,
                PRIMARY KEY (username, "electionId")
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

const createVote = async vote => {
  try {
    await db.query('INSERT INTO votes values($1, $2, $3)', [vote.username, vote.electionId, vote.optionId])
  }
  catch (err) {
    console.error(err)
  }
}

const getResults = async electionId => {
  try {
    const results = await db.query(
      `SELECT "optionId", name, COUNT(username)
            FROM votes INNER JOIN options ON votes."optionId"=options.id
            WHERE votes."electionId"=$1
            GROUP BY "optionId",name
            ORDER BY count DESC`
      , [electionId]
    )
    return results.rows
  }
  catch (err) {
    console.error(err)
  }
}

module.exports = {
  createTableVotes: createTableVotes,
  createVote: createVote,
  getResults: getResults
}
