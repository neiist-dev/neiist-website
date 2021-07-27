const db = require('./db');

const createElections = async () => {
  try {
    await db.query(
      `CREATE TABLE elections(
                id serial PRIMARY KEY,
                name varchar(100),
                "startDate" date,
                "endDate" date

            )`,
    );
  } catch (err) {
    if (err.code === '42P07') ; // table already exists
    else { console.error(err); }
  }
};

const createOptions = async () => {
  try {
    await db.query(
      `CREATE TABLE options(
                id serial PRIMARY KEY,
                name varchar(100),
                "electionId" INTEGER REFERENCES elections(id) ON DELETE CASCADE ON UPDATE CASCADE
            )`,
    );
  } catch (err) {
    if (err.code === '42P07') ; // table already exists
    else { console.error(err); }
  }
};

const getElections = async () => {
  let elections;
  try {
    elections = await db.query('SELECT * FROM elections');
  } catch (err) {
    console.error(err);
  }
  return elections.rows;
};

const getActiveUnvotedElections = async (username) => {
  let elections;
  try {
    const today = new Date();
    elections = await db.query(
      `SELECT *
            FROM elections
            WHERE "startDate" <= $1
              and $1 <= "endDate"
              and id NOT IN (
                  SELECT "electionId"
                  FROM votes
                  WHERE username=$2
              ) `,
      [today, username],
    );
  } catch (err) {
    console.error(err);
  }
  return elections.rows;
};

const createElection = async (election) => {
  let createdElection;
  try {
    createdElection = await db.query('INSERT INTO elections(name, "startDate", "endDate") VALUES($1, $2, $3) RETURNING *', [election.name, election.startDate, election.endDate]);
  } catch (err) {
    console.error(err);
  }
  return createdElection.rows[0];
};

const addOption = async (optionName, electionId) => {
  try {
    db.query('INSERT INTO options(name, "electionId") VALUES($1, $2)', [optionName, electionId]);
  } catch (err) {
    console.error(err);
  }
};

const getOptions = async (electionId) => {
  let options;
  try {
    options = await db.query('SELECT * FROM options WHERE "electionId"=$1', [electionId]);
  } catch (err) {
    console.error(err);
  }
  return options.rows;
};

module.exports = {
  createElections,
  createOptions,
  getElections,
  getActiveUnvotedElections,
  createElection,
  addOption,
  getOptions,
};
