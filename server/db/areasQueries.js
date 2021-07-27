const db = require('./db');

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
  let areasInserted;
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE areas CASCADE');

    areasInserted = await Promise.all(areas.map(async (area) => {
      const areaInserted = await client.query('INSERT INTO areas VALUES($1, $2, $3) RETURNING *', [area.code, area.short, area.long]);
      return areaInserted.rows[0];
    }));

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
  } finally {
    client.release();
  }
  return areasInserted;
};

const getAreas = async () => {
  let allAreas;
  try {
    allAreas = await db.query('SELECT * FROM areas');
  } catch (err) {
    console.error(err.message);
  }
  return allAreas.rows;
};

module.exports = {
  createAreas,
  setAreas,
  getAreas,
};
