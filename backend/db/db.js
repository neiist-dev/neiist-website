const { Pool } = require('pg')
const pool = new Pool()

const query = async (text, params) => {
    const res = await pool.query(text, params)
    return res
}

const getClient = async () => {
    const client = await pool.connect()
    return client
}

module.exports = {
    query,
    getClient
}