const db = require('../db/electionsQueries')

const getActiveElections = async () => {
    const elections = await db.getElections()
    console.log("elections:", elections)
    const currDate = new Date()
    const activeElections = elections.filter(election => election.startDate<=currDate<=election.endDate )
    console.log("activeElections:", activeElections)
    return activeElections
}

const newElection = async election => {
    const {id} = await db.createElection(election)
    election.options.forEach(optionName => db.addOption(optionName, id))
}

module.exports = {
    getActiveElections: getActiveElections,
    newElection: newElection,
}