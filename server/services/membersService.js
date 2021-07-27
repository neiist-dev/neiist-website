const db = require('../db/membersQueries');

const waitingPeriod = 4;
const validPeriod = 12;
const gracePeriod = 6;

const addMonthsToDate = (numMonths, date) => {
  const newMonth = date.getMonth() + numMonths;
  const newDate = new Date(date);
  newDate.setMonth(newMonth);
  return newDate;
};

const isMemberExpired = async (username) => {
  const member = await db.getMember(username);
  const expirationDate = addMonthsToDate(validPeriod, member.registerDate);
  const currDate = new Date();
  return currDate >= expirationDate;
};

const canMemberVote = async (username) => {
  const member = await db.getMember(username);
  const currDate = new Date();
  return currDate >= member.canVoteDate;
};

const getMember = async (username) => {
  const memberInformation = await db.getMember(username);
  if (!memberInformation) return null;

  const isExpired = await isMemberExpired(memberInformation.username);
  const canVote = await canMemberVote(memberInformation.username);

  const member = {
    username: memberInformation.username,
    isExpired,
    canVote,
  };

  return member;
};

const registerMember = async (username) => {
  const currDate = new Date();
  const canVoteDate = addMonthsToDate(waitingPeriod, currDate);

  const member = {
    username,
    registerDate: currDate,
    canVoteDate,
  };
  db.createMember(member);
};

const renovateMember = async (username) => {
  const member = await db.getMember(username);
  const currDate = new Date();

  const gracePeriodExpirationDate = addMonthsToDate(validPeriod + gracePeriod, member.registerDate);
  const gracePeriodExpired = (currDate >= gracePeriodExpirationDate);
  const canVoteDate = (gracePeriodExpired ? addMonthsToDate(waitingPeriod, currDate) : currDate);

  member.registerDate = currDate;
  member.canVoteDate = canVoteDate;
  db.updateMember(member);
};

module.exports = {
  getMember,
  registerMember,
  canMemberVote,
  isMemberExpired,
  renovateMember,
};
