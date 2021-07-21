const db = require('./db')

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
  createVote: createVote,
  getResults: getResults
}
