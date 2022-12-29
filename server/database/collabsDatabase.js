const db = require("./database");

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
      )`
    );
  } catch (err) {
    if (err.code !== "42P07") {
      console.error(err);
    }
  }
};

const createCurrentCollabView = async () => {
  try {
    await db.query(
      `CREATE OR REPLACE VIEW curr_collaborators AS
        SELECT *
        FROM collaborators
        WHERE "fromDate" <= current_date::date
          AND "toDate" > current_date::date;
    `
    );
  } catch (err) {
    console.error(err);
  }
};

const addCollaborator = async (username, collab) => {
  try {
    await db.query(
      `INSERT INTO collaborators(username, campus, "teams", "fromDate", "toDate")
      VALUES($1, $2, $3,current_date, '9999-12-31')`,
      [username, collab.campus, collab.teams]
    );
  } catch (err) {
    console.error(err);
  }
};

const removeCollaborator = async (username) => {
  try {
    await db.query(
      'UPDATE curr_collaborators SET "toDate" = current_date WHERE "username" = $1',
      [username]
    );
  } catch (err) {
    console.error(err);
  }
};

const getCurrentCollab = async (username) => {
  let collab;
  try {
    const collabResult = await db.query(
      'SELECT username, "teams"  \
      FROM curr_collaborators \
      WHERE username=$1',
      [username]
    );
    [collab] = collabResult.rows;
  } catch (err) {
    console.error(err);
  }
  return collab;
};

const getCurrentCollabs = async () => {
  let collabs;
  try {
    const collabsResult = await db.query(
      'SELECT curr_collaborators.username, name, email, campus, role, "subRole", "teams" \
      FROM curr_collaborators FULL JOIN members \
      ON curr_collaborators.username=members.username \
      WHERE curr_collaborators.username IS NOT NULL \
      ORDER BY name ASC'
    );
    collabs = collabsResult.rows;
  } catch (err) {
    console.error(err);
  }
  return collabs;
};

const getCurrentTeamMembers = async (teamsAux) => {
  //It accepts one team, or multiple ones.
  let collabs;
  const teams = `%${teamsAux.join("%,%")}%`;
  
  try {
    const collabsResult = await db.query(
      `SELECT username, name, campus, "teams" \
      FROM curr_collaborators NATURAL JOIN members \
      where "teams" LIKE ANY(string_to_array($1,',')) \
      ORDER BY name ASC`,
      [teams]
    );
    collabs = collabsResult.rows;
  } catch (err) {
    console.error(err);
  }
  return collabs;
};

module.exports = {
  createCollaborators,
  createCurrentCollabView,
  addCollaborator,
  removeCollaborator,
  getCurrentCollab,
  getCurrentCollabs,
  getCurrentTeamMembers,
};
