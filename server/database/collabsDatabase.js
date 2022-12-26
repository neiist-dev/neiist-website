const db = require('./database');

const createCollaborators = async () => {
  try {
    await db.query(
      `CREATE TABLE collaborators(
        "id" SERIAL PRIMARY KEY,
        "username" varchar(10) NOT NULL,
        "campus" varchar(1) NOT NULL,
        "teams" varchar(50) NOT NULL,
        "role" varchar(25) DEFAULT 'COLLAB',
        "subRole" varchar(100),
        "fromDate" date NOT NULL,
        "toDate" date NOT NULL
      )`,
    );
  } catch (err) {
    if (err.code !== '42P07'){ console.error(err); }
  }
};

const createCurrentCollabView = async () => {
  try {
    await db.query(
      `CREATE OR REPLACE VIEW curr_collaborators AS
        SELECT *
        FROM collaborators
        WHERE current_date::date BETWEEN "fromDate" and "toDate";
    `,);
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  createCollaborators,
  createCurrentCollabView,
};
