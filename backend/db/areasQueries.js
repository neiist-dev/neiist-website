const db = require('./db')

const setAreas = async areas => {
  const client = await db.getClient()
  try {
    await client.query("BEGIN")
    await client.query("TRUNCATE TABLE areas CASCADE")
    for (let area of areas)
      await client.query("INSERT INTO areas VALUES($1, $2, $3)", [area.code, area.short, area.long])
    await client.query("COMMIT")
  }
  catch (err) {
    await client.query("ROLLBACK")
    console.error(err)
  }
  finally {
    client.release()
  }
}

const getAreas = async () => {
  try {
    const allAreas = await db.query("SELECT * FROM areas")
    return allAreas.rows
  }
  catch (err) {
    console.error(err.message)
  }
}

module.exports = {
  setAreas: setAreas,
  getAreas: getAreas,
}
