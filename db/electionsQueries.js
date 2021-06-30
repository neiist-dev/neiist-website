const Pool = require('pg').Pool
const pool = new Pool()

const getElections = async () => {
    const client = await pool.connect()
    try {
        const elections = await client.query("SELECT * FROM elections")
        return elections.rows
    }
    catch (err) {
        console.error(err)
    }
    finally {
        client.release()
    }
}

const createElection = async election => {
    const client = await pool.connect()
    try {
        const createdElection = await client.query('insert into elections(name, "startDate", "endDate") values($1, $2, $3) RETURNING *', [election.name, election.startDate, election.endDate])
        return createdElection.rows[0]
    }
    catch (err) {
        console.error(err)
    }
    finally {
        client.release()
    }
}

const addOption = async (optionName, electionId) => {
    const client = await pool.connect()
    try {
        client.query('insert into options(name, "electionId") values($1, $2)', [optionName, electionId])
    }
    catch (err) {
        console.error(err)
    }
    finally {
        client.release()
    }
}

module.exports = {
    getElections: getElections,
    createElection: createElection,
    addOption: addOption
}
