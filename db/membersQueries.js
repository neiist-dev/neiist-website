const Pool = require('pg').Pool
const pool = new Pool()

// const setMember = async member => {
//     const existingMember = await getMemberByUsername(member.username)

//     if (!existingMember) createMember(member)
//     else updateMember(member)
// }

const createMember = async member => {
  const client = await pool.connect()
  try {
    await client.query("begin")
    await client.query("insert into members values($1, $2, $3)", [member.username, member.registerDate, member.canVoteDate])
    await client.query("commit")
  }
  catch (err) {
    await client.query("rollback")
    console.error(err)
  }
  finally {
    client.release()
  }
}

const updateMember = async member => {
  const client = await pool.connect()
  try {
    await client.query("begin")
    await client.query('UPDATE members SET "registerDate" = $1, "canVoteDate" = $2 WHERE username = $3', [member.registerDate, member.canVoteDate, member.username])
    await client.query("commit")
  }
  catch (err) {
    await client.query("rollback")
    console.error(err)
  }
  finally {
    client.release()
  }
}

const getMember = async username => {
  const client = await pool.connect()
  try {
    const member = await client.query("select * from members where username = $1", [username])
    return member.rows[0]
  }
  catch (err) {
    console.error(err)
  }
  finally {
    client.release()
  }
}

module.exports = {
  createMember: createMember,
  updateMember: updateMember,
  getMember: getMember
}