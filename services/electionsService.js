const db = require('../db/electionsQueries')

const newElection = async name => {
    db.createElection(name)
}

// const getAreas = async () => {
//     const areas = db.getAreas()
//     return areas
// }

module.exports = {
    newElection: newElection,
    // getAreas: getAreas
}