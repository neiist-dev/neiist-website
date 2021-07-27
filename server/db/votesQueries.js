const db = require('./db');

const createVotes = async () => {
  try {
    await db.query(
      `CREATE TABLE votes(
                username varchar(9),
                "electionId" INTEGER REFERENCES elections(id) ON DELETE CASCADE ON UPDATE CASCADE,
                "optionId" INTEGER REFERENCES options(id) ON DELETE CASCADE ON UPDATE CASCADE,
                PRIMARY KEY (username, "electionId")
            )`,
    );
  } catch (err) {
    if (err.code === '42P07') ; // table already exists
    else { console.error(err); }
  }
};

const createVote = async (vote) => {
  try {
    await db.query('INSERT INTO votes values($1, $2, $3)', [vote.username, vote.electionId, vote.optionId]);
  } catch (err) {
    console.error(err);
  }
};

const getResults = async (electionId) => {
  let results;
  try {
    results = await db.query(
      `SELECT "optionId", name, COUNT(username)
            FROM votes INNER JOIN options ON votes."optionId"=options.id
            WHERE votes."electionId"=$1
            GROUP BY "optionId",name
            ORDER BY count DESC`,
      [electionId],
    );
  } catch (err) {
    console.error(err);
  }
  return results.rows;
};

module.exports = {
  createVotes,
  createVote,
  getResults,
};
