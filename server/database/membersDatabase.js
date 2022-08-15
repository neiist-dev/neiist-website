const db = require('./database');

const createMembers = async () => {
  try {
    await db.query(
      `CREATE TABLE members(
                "username" varchar(10) PRIMARY KEY,
                "name" varchar(255),
                "email" varchar(255),
                "registerDate" date,
                "canVoteDate" date,
                "renewStartDate" date,
                "renewEndDate" date
            )`,
    );
  } catch (err) {
    if (err.code === '42P07') ; // table already exists
    else { console.error(err); }
  }
};

const createMember = async (member) => {
  try {
    await db.query("INSERT INTO members VALUES($1, $2, $3, $4, $5, $6, $7)", [
      member.username,
      member.name,
      member.email,
      member.registerDate,
      member.canVoteDate,
      member.renewStartDate,
      member.renewEndDate,
    ]);
  } catch (err) {
    console.error(err);
  }
};

const updateMember = async (member) => {
  try {
    await db.query(
      'UPDATE members SET "name" = $1, "email" = $2, "registerDate" = $3::date, "canVoteDate" = $4::date, "renewStartDate" = $5::date, "renewEndDate" = $6::date WHERE "username" = $7',
      [
        member.name,
        member.email,
        member.registerDate,
        member.canVoteDate,
        member.renewStartDate,
        member.renewEndDate,
        member.username,
      ]
    );
  } catch (err) {
    console.error(err);
  }
};

const getMember = async (username) => {
  let member;
  try {
    const memberResult = await db.query(
      'SELECT * FROM members WHERE "username" = $1',
      [username]
    );
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
