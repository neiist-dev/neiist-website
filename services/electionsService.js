const db = require('../db/electionsQueries')

const newElection = async name => {
    db.createElection(name)
}

const latestElection = async () => {
    const id = await db.latestElection()
    return id
}

// const getAreas = async () => {
//     const areas = db.getAreas()
//     return areas
// }

module.exports = {
    newElection: newElection,
    latestElection: latestElection
    // getAreas: getAreas
}