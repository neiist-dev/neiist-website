const db = require('../db/votesQueries')

// const getActiveElections = async () => {
//     const elections = await db.getElections()
//     const currDate = new Date()
//     const activeElections = elections.filter(election => election.startDate<=currDate<=election.endDate )
//     return activeElections
// }

const newVote = async vote => {
  await db.createVote(vote)
}

const getResults = async electionId => {
  const results = await db.getResults(electionId)
  return results
}

module.exports = {
  // getActiveElections: getActiveElections,
  newVote: newVote,
  getResults: getResults
}