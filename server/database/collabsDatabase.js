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

const createAdminsView = async () => {
  try {
    await db.query(
      `CREATE OR REPLACE VIEW admins AS
        SELECT *
        FROM curr_collaborators
        WHERE "teams" LIKE '%COOR-DEV%'
        OR ("role" LIKE '%Direção%'
          AND "subRole" LIKE '%Presidente%');
      `
    );
  } catch (err) {
    console.error(err);
  }
};

const createGACMembersView = async () => {
  try {
    await db.query(
      `CREATE OR REPLACE VIEW "gacMembers" AS
        SELECT *
        FROM curr_collaborators
        WHERE ("teams" NOT LIKE '%SINFO%'
          AND "role" LIKE '%Direção%')
        OR ("role" LIKE '%MAG%'
          AND "subRole" LIKE '%Presidente%');
      `
    );
  } catch (err) {
    console.error(err);
  }
};

const createCoordenatorsView = async () => {
  try {
    await db.query(
      `CREATE OR REPLACE VIEW coordenators AS
        SELECT *
        FROM curr_collaborators
        WHERE "teams" LIKE '%COOR%';`
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
      `UPDATE curr_collaborators SET "toDate" = current_date WHERE "username" = $1`,
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
      `SELECT username, "teams" 
      FROM curr_collaborators
      WHERE username=$1;`,
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
      `SELECT curr_collaborators.username, name, email, campus, role, "subRole", "teams"
      FROM curr_collaborators FULL JOIN members
      ON curr_collaborators.username=members.username
      WHERE curr_collaborators.username IS NOT NULL
      ORDER BY name ASC`
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
      `SELECT curr_collaborators.username, name, campus, teams
      FROM curr_collaborators FULL JOIN members
      ON curr_collaborators.username=members.username
      WHERE teams LIKE ANY(string_to_array($1,','))
      ORDER BY name ASC`,
      [teams]
    );
    collabs = collabsResult.rows;
  } catch (err) {
    console.error(err);
  }
  return collabs;
};

const checkAdmin = async (username) => {
  let admin;
  try {
    const adminResult = await db.query(
      `SELECT username
      FROM admins
      WHERE username LIKE $1;`,
      [username]
    );
    [admin,] = adminResult.rows;
  } catch (err) {
    console.error(err);
  }
  return admin.username === username;
};

const checkGACMember = async (username) => {
  let gac;
  try {
    const gacResult = await db.query(
      `SELECT username
      FROM "gacMembers"
      WHERE username LIKE $1;`,
      [username]
    );
    [gac,] = gacResult.rows;
  } catch (err) {
    console.error(err);
  }
  return gac.username === username;
};

const checkCoordenator = async (username) => {
  let coor;
  try {
    const coorResult = await db.query(
      `SELECT username
      FROM coordenators
      WHERE username LIKE $1;`,
      [username]
    );
    [coor,] = coorResult.rows;
  } catch (err) {
    console.error(err);
  }
  return coor.username === username;
};

module.exports = {
  createCollaborators,
  createCurrentCollabView,
  createCoordenatorsView,
  createGACMembersView,
  createAdminsView,
 
  addCollaborator,
  removeCollaborator,
 
  getCurrentCollab,
  getCurrentCollabs,
  getCurrentTeamMembers,

  checkAdmin,
  checkGACMember,
};
