const db = require('./db')

const createMembers = async () => {
  try {
    await db.query(
      `CREATE TABLE members(
                username varchar(9) PRIMARY KEY,
                "registerDate" date,
                "canVoteDate" date
            )`
    )
  }
  catch (err) {
    if (err.code === '42P07')
      ; // table already exists
    else
      console.error(err)
  }
}

const createMember = async member => {
  try {
    await db.query("INSERT INTO members VALUES($1, $2, $3)", [member.username, member.registerDate, member.canVoteDate])
  }
  catch (err) {
    console.error(err)
  }
}

const updateMember = async member => {
  try {
    await db.query('UPDATE members SET "registerDate" = $1, "canVoteDate" = $2 WHERE username = $3', [member.registerDate, member.canVoteDate, member.username])
  }
  catch (err) {
    console.error(err)
  }
}

const getMember = async username => {
  try {
    const member = await db.query("SELECT * FROM members WHERE username = $1", [username])
    return member.rows[0]
  }
  catch (err) {
    console.error(err)
  }
}

module.exports = {
  createMembers: createMembers,
  createMember: createMember,
  updateMember: updateMember,
  getMember: getMember
}