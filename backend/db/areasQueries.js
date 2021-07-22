const db = require('./db')

const createAreas = async () => {
  try {
    await db.query(
      `CREATE TABLE areas (
                code varchar(10) PRIMARY KEY,
                short varchar(10),
                long varchar(100)
            )`
    )
  }
  catch (err) {
    if (err.code === '42P07')
      ; // table already exists
    else
      console.error(err)
  }
}

const cleanAreas = async () => {
  try {
    await db.query("TRUNCATE TABLE areas CASCADE")
  }
  catch (err) {
    console.error(err)
  }
}

const setAreas = async areas => {
  const client = await db.getClient()
  try {
    await client.query("BEGIN")
    await client.query("TRUNCATE TABLE areas CASCADE")
    const areasInserted = []
    for (let area of areas) {
      const areaInserted = await client.query("INSERT INTO areas VALUES($1, $2, $3) RETURNING *", [area.code, area.short, area.long])
      areasInserted.push(areaInserted.rows[0])
    }
    await client.query("COMMIT")
    return areasInserted
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
  createAreas: createAreas,
  cleanAreas: cleanAreas,
  setAreas: setAreas,
  getAreas: getAreas,
}
