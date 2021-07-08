const db = require('../db/electionsQueries')

const getActiveElections = async () => {
  const elections = await db.getElections()
  const currDate = new Date()
  const activeElections = elections.filter(election => election.startDate <= currDate <= election.endDate)
  return activeElections
}

const newElection = async election => {
  const { id } = await db.createElection(election)
  election.options.forEach(optionName => db.addOption(optionName, id))
}

const getOptions = async id => {
  const options = await db.getOptions(id)
  return options
}

module.exports = {
  getActiveElections: getActiveElections,
  newElection: newElection,
  getOptions: getOptions
}