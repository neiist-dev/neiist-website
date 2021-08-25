const db = require('./database');

const createTheses = async () => {
  try {
    await db.query(
      `CREATE TABLE theses(
                id integer PRIMARY KEY,
                title text,
                supervisors text[],
                vacancies integer,
                location text,
                observations text,
                objectives text,
                requirements text,
                area1 varchar(10) REFERENCES areas(code) ON DELETE CASCADE ON UPDATE CASCADE,
                area2 varchar(10) REFERENCES areas(code) ON DELETE CASCADE ON UPDATE CASCADE
            )`,
    );
  } catch (err) {
    if (err.code === '42P07') ; // table already exists
    else { console.error(err); }
  }
};

const setTheses = async (theses) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE theses CASCADE');

    theses.forEach(async (thesis) => {
      await client.query('INSERT INTO theses VALUES($1, $2, $3::text[], $4, $5, $6, $7, $8, $9, $10)',
        [thesis.id,
          thesis.title,
          thesis.supervisors,
          thesis.vacancies,
          thesis.location,
          thesis.observations,
          thesis.objectives,
          thesis.requirements,
          thesis.areas[0],
          thesis.areas[1],
        ]);
    });

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.stack);
  } finally {
    client.release();
  }
};

const getTheses = async () => {
  let theses;
  try {
    const thesesResult = await db.query('select * from theses');
    theses = thesesResult.rows;
  } catch (err) {
    console.error(err.message);
  }
  return theses;
};

module.exports = {
  createTheses,
  setTheses,
  getTheses,
};
