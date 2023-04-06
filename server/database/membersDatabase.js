const db = require('./database');

const createMembers = async () => {
  try {
    await db.query(
      `CREATE TABLE members(
                "username" varchar(10) PRIMARY KEY,
                "name" varchar(255),
                "email" varchar(255),
                "courses" varchar(33),
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

const createRenewalNotifications = async () => {
  try {
    await db.query(
      `CREATE TABLE "renewalNotifications" (
        "username" varchar(10) PRIMARY KEY,
        FOREIGN KEY (username) REFERENCES members(username)
      )`,
    );
    await createRenewalNotificationsTrigger();
  } catch (err) {
    if (err.code !== '42P07') console.error(err); 
  }
};

const createRenewalNotificationsTrigger = async () => {
  try{
    await db.query(
      `CREATE OR REPLACE FUNCTION remove_expired_warned_users() RETURNS TRIGGER AS $$
      BEGIN
        DELETE FROM "renewalNotifications"
        WHERE username = NEW.username
          AND NEW.username IN (SELECT username FROM members WHERE "renewEndDate" < NOW());
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER remove_expired_warned_users_trigger
      AFTER INSERT ON "renewalNotifications"
      FOR EACH ROW
      EXECUTE FUNCTION remove_expired_warned_users();
      `
    );
  } catch (err) {
    console.error(err); 
  }
};

const createMember = async (member) => {
  try {
    await db.query("INSERT INTO members VALUES($1, $2, $3, $4, $5, $6, $7, $8)", [
      member.username,
      member.name,
      member.email,
      member.courses,
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
      'UPDATE members SET "name" = $1, "email" = $2, "courses" = $3, "registerDate" = $4::date, "canVoteDate" = $5::date, "renewStartDate" = $6::date, "renewEndDate" = $7::date WHERE "username" = $8',
      [
        member.name,
        member.email,
        member.courses,
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

const getActiveMembers = async (currDate, limitDate) => {
  let activeMembers;
  try {
    const activeMembersResult = await db.query(
      'SELECT * FROM members \
        WHERE "registerDate" > $1::date AND "renewEndDate" > $2::date \
        ORDER BY length(username), username',
      [limitDate, currDate]
    );
    activeMembers = activeMembersResult.rows;
  } catch (err) {
    console.error(err);
  }
  return activeMembers;
};

const getAllMembers = async () => {
  let allMembers;
  try {
    const allMembersResult = await db.query(
      'SELECT * FROM members ORDER BY length(username), username'
    );
    allMembers = allMembersResult.rows;
  } catch (err) {
    console.error(err);
  }
  return allMembers;
};

const getRenewalNotifications = async () => {
  let members;
  try {
    const memberResult = await db.query(
      'SELECT * FROM "renewalNotifications"',
    );
    members = memberResult.rows;
  } catch (err) {
    console.error(err);
  }
  return members;
};

const addRenewalNotification = async (username) => {
  try {
    await db.query('INSERT INTO "renewalNotifications" VALUES ($1)', [username]);
  } catch (err) {
    console.error(err);
  }
};

const removeRenewalNotification = async (username) => {
  try {
    await db.query('DELETE FROM "renewalNotifications" WHERE "username" = $1', [username]);
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  createMembers,
  createMember,
  updateMember,
  getMember,
  getActiveMembers,
  getAllMembers,
  createRenewalNotifications,
  addRenewalNotification,
  removeRenewalNotification,
  getRenewalNotifications,
};
