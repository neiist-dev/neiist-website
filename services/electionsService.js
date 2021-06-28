const db = require('../db/electionsQueries')

const newElection = async election => {
    const {id} = await db.createElection(election)
    election.options.forEach(optionName => db.addOption(optionName, id))
}

module.exports = {
    newElection: newElection,
}