const Pool = require('pg').Pool
const pool = new Pool()

const setAreas = async areas => {
  const client = await pool.connect()
  try {
    await client.query("begin")
    await client.query("truncate table areas cascade")
    for (let area of areas)
      await client.query("insert into areas values($1, $2, $3)", [area.code, area.short, area.long])
    await client.query("commit")
  }
  catch (err) {
    await client.query("rollback")
    console.error(err)
  }
  finally {
    client.release()
  }
}

const getAreas = async areas => {
  const client = await pool.connect()
  try {
    const allAreas = await client.query("select * from areas")
    return allAreas.rows
  }
  catch (err) {
    console.error(err.message)
  }
  finally {
    client.release()
  }
}

module.exports = {
  setAreas: setAreas,
  getAreas: getAreas,
}
