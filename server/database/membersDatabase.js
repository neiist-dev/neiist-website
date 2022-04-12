const db = require('./database');

const createMembers = async () => {
  try {
    await db.query(
      `CREATE TABLE members(
                username varchar(10) PRIMARY KEY,
                "registerDate" date,
                "canVoteDate" date
            )`,
    );
  } catch (err) {
    if (err.code === '42P07') ; // table already exists
    else { console.error(err); }
  }
};

const createMember = async (member) => {
  try {
    await db.query('INSERT INTO members VALUES($1, $2, $3)', [member.username, member.registerDate, member.canVoteDate]);
  } catch (err) {
    console.error(err);
  }
};

const updateMember = async (member) => {
  try {
    await db.query('UPDATE members SET "registerDate" = $1, "canVoteDate" = $2 WHERE username = $3', [member.registerDate, member.canVoteDate, member.username]);
  } catch (err) {
    console.error(err);
  }
};

const getMember = async (username) => {
  let member;
  try {
    const memberResult = await db.query('SELECT * FROM members WHERE username = $1', [username]);
    [member] = memberResult.rows;
  } catch (err) {
    console.error(err);
  }
  return member;
};

module.exports = {
  createMembers,
  createMember,
  updateMember,
  getMember,
};
