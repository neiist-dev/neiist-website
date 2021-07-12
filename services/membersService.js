const db = require('../db/membersQueries')

const waitingPeriod = 4
const validPeriod = 12
const gracePeriod = 6

const getMember = async username => {
  const memberInformation = await db.getMember(username)
  if (!memberInformation) return null

  const isExpired = await isMemberExpired(memberInformation.username)
  const canVote = await canMemberVote(memberInformation.username)

  const member = {
    username: memberInformation.username,
    isExpired: isExpired,
    canVote: canVote
  }

  return member
}

const registerMember = async username => {
  const currDate = new Date()
  const canVoteDate = addMonthsToDate(waitingPeriod, currDate)

  const member = {
    username: username,
    registerDate: currDate,
    canVoteDate: canVoteDate
  }
  db.createMember(member)
}

const canMemberVote = async username => {
  const member = await db.getMember(username)
  const currDate = new Date()
  return currDate >= member.canVoteDate
}

const isMemberExpired = async username => {
  const member = await db.getMember(username)
  const expirationDate = addMonthsToDate(validPeriod, member.registerDate)
  const currDate = new Date()
  return currDate >= expirationDate
}

const renovateMember = async username => {
  const member = await db.getMember(username)
  const currDate = new Date()

  const gracePeriodExpired = (currDate >= addMonthsToDate(validPeriod + gracePeriod, member.registerDate))
  const canVoteDate = (gracePeriodExpired ? addMonthsToDate(waitingPeriod, currDate) : currDate)

  member.registerDate = currDate
  member.canVoteDate = canVoteDate
  db.updateMember(member)
}

const addMonthsToDate = (numMonths, date) => {
  const newMonth = date.getMonth() + numMonths
  let newDate = new Date(date)
  newDate.setMonth(newMonth)
  return newDate
}

module.exports = {
  getMember: getMember,
  registerMember: registerMember,
  canMemberVote: canMemberVote,
  isMemberExpired: isMemberExpired,
  renovateMember: renovateMember
}