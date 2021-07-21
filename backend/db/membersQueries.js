const db = require('./db')

const createTableMembers = async () => {
  const client = await db.getClient()
  try {
    await client.query("BEGIN")
    await client.query("DROP TABLE IF EXISTS members CASCADE")
    await client.query(
      `CREATE TABLE members(
                username varchar(9) PRIMARY KEY,
                "registerDate" date,
                "canVoteDate" date
            )`
    )
    await client.query("COMMIT")
  }
  catch (err) {
    await client.query("ROLLBACK")
    console.error(err)
  }
  finally {
    client.release()
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
  createTableMembers: createTableMembers,
  createMember: createMember,
  updateMember: updateMember,
  getMember: getMember
}