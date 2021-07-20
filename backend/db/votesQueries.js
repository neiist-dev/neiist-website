const Pool = require('pg').Pool
const pool = new Pool()

const createVote = async vote => {
  const client = await pool.connect()
  try {
    await client.query('INSERT INTO votes values($1, $2, $3)', [vote.username, vote.electionId, vote.optionId])
  }
  catch (err) {
    console.error(err)
  }
  finally {
    client.release()
  }
}

const getResults = async electionId => {
  const client = await pool.connect()
  try {
    const results = await client.query(
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
  finally {
    client.release()
  }
}

module.exports = {
  createVote: createVote,
  getResults: getResults
}
