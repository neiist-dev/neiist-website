const db = require('./db')

const setTheses = async theses => {
  const client = await db.getClient()
  try {
    await client.query("BEGIN")
    await client.query("TRUNCATE TABLE theses CASCADE")
    for (let thesis of theses) {
      await client.query("INSERT INTO theses VALUES($1, $2, $3::text[], $4, $5, $6, $7, $8, $9, $10)",
        [thesis.id, thesis.title, thesis.supervisors, thesis.vacancies, thesis.location, thesis.observations, thesis.objectives, thesis.requirements, thesis.areas[0], thesis.areas[1]])
    }
    await client.query("COMMIT")
  }
  catch (err) {
    await client.query("ROLLBACK")
    console.error(err.stack)
  }
  finally {
    client.release()
  }
}

const getThesesByAreas = async areas => {
  try {
    if (!areas) {
      const theses = await db.query("select * from theses")
      return theses.rows
    }

    else if (areas.length === 1) {
      const area = areas[0]
      const theses = await db.query("select * from theses where area1 = $1 or area2 = $1", [area])
      return theses.rows
    }

    else if (areas.length === 2) {
      const area1 = areas[0]
      const area2 = areas[1]
      theses = await db.query("select * from theses where (area1 = $1 or area2 = $1) and (area1 = $2 or area2 = $2)", [area1, area2])
      return theses.rows
    }

    else
      console.error("can only handle 0, 1 or 2 areas")
  }
  catch (err) {
    console.error(err.message)
  }
}

module.exports = {
  setTheses: setTheses,
  getThesesByAreas: getThesesByAreas,
}
