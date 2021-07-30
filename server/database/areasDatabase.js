const db = require('./database');

const createAreas = async () => {
  try {
    await db.query(
      `CREATE TABLE areas (
                code varchar(10) PRIMARY KEY,
                short varchar(10),
                long varchar(100)
            )`,
    );
  } catch (err) {
    if (err.code === '42P07') ; // table already exists
    else { console.error(err); }
  }
};

const setAreas = async (areas) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE areas CASCADE');

    areas.forEach(async (area) => {
      await client.query('INSERT INTO areas VALUES($1, $2, $3)', [area.code, area.short, area.long]);
    });

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
  } finally {
    client.release();
  }
};

const getAreas = async () => {
  let areas;
  try {
    const areasResult = await db.query('SELECT * FROM areas');
    areas = areasResult.rows;
  } catch (err) {
    console.error(err.message);
  }
  return areas;
};

module.exports = {
  createAreas,
  setAreas,
  getAreas,
};
