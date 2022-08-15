const { membersDatabase } = require('../database');

const waitingPeriod = 4;
const validPeriod = 12;
const gracePeriod = 6;

const addMonthsToDate = (numMonths, date) => {
  const newMonth = date.getMonth() + numMonths;
  const newDate = new Date(date);
  newDate.setMonth(newMonth);
  return newDate;
};

const canMemberVote = async (currDate, member) => {
  return currDate >= member.canVoteDate;
};

const isMemberExpired = async (currDate, member) => {
  return currDate >= member.renewStartDate;
};

const getMember = async (username) => {
  const memberInformation = await membersDatabase.getMember(username);
  if (!memberInformation) return null;
  const currDate = new Date();

  const isExpired = await isMemberExpired(currDate, memberInformation);
  const canVote = await canMemberVote(currDate, memberInformation);

  const member = {
    username: memberInformation.username,
    name: memberInformation.name,
    email: memberInformation.email,
    isExpired,
    canVote,
  };

  return member;
};

const registerMember = async (member) => {
  const currDate = new Date();
  const canVoteDate = addMonthsToDate(waitingPeriod, currDate);
  const renewStartDate = addMonthsToDate(validPeriod, currDate);
  const renewEndDate = addMonthsToDate(validPeriod + gracePeriod, currDate);

  const newMember = member;
  newMember.registerDate = currDate;
  newMember.canVoteDate = canVoteDate;
  newMember.renewStartDate = renewStartDate;
  newMember.renewEndDate = renewEndDate;

  membersDatabase.createMember(newMember);
};

const renovateMember = async (username, nameAndEmail) => {
  const member = await membersDatabase.getMember(username);
  const currDate = new Date();
  const gracePeriodExpired = currDate >= member.renewEndDate;

  // name/email changed in fenix OR if we don't have record of name/email
  const name =
    nameAndEmail.name != member.name ? nameAndEmail.name : member.name;
  const email =
    nameAndEmail.email != member.email ? nameAndEmail.email : member.email;

  const canVoteDate = gracePeriodExpired
    ? addMonthsToDate(waitingPeriod, currDate)
    : currDate;
  const renewStartDate = addMonthsToDate(validPeriod, currDate);
  const renewEndDate = addMonthsToDate(validPeriod + gracePeriod, currDate);

  member.name = name;
  member.email = email;
  member.registerDate = currDate;
  member.canVoteDate = canVoteDate;
  member.renewStartDate = renewStartDate;
  member.renewEndDate = renewEndDate;

  membersDatabase.updateMember(member);
};

module.exports = {
  getMember,
  registerMember,
  renovateMember,
};
