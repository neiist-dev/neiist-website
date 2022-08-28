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

/* Status of Member */
const canMemberVote = (currDate, member) =>
  currDate >= member.canVoteDate && currDate < member.renewStartDate ;

const hastoRenew = (currDate, member) =>
  currDate >= member.renewStartDate && currDate <= member.renewEndDate;

const isMemberExpired = (currDate, member) =>
  currDate > member.renewEndDate;

const getStatus = (currDate, member) => {
  const canVote = canMemberVote(currDate, member);
  const renew = hastoRenew(currDate, member);
  const expired = isMemberExpired(currDate, member);

  // If member isn't registed in database, frontEnd returns "NaoSocio"
  if (!canVote && !renew && !expired) return "SocioRegular";
  else if (canVote && !renew && !expired) return "SocioEleitor";
  else if (renew && !expired) return "Renovar";
  else return "NaoSocio";
};

const getMember = async (username) => {
  const memberInfo = await membersDatabase.getMember(username);
  if (!memberInfo) return null;

  const currDate = new Date();
  memberInfo.status = getStatus(currDate, memberInfo);

  return memberInfo;
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

const renovateMember = async (username, nameEmailCourses) => {
  const memberInfo = await membersDatabase.getMember(username);
  const currDate = new Date();
  const gracePeriodExpired = isMemberExpired(currDate, memberInfo);

  // changed in fenix OR if column in database = null
  const name =
    nameEmailCourses.name != memberInfo.name ? nameEmailCourses.name : memberInfo.name;
  const email =
    nameEmailCourses.email != memberInfo.email ? nameEmailCourses.email : memberInfo.email;
  const courses =
    nameEmailCourses.courses != memberInfo.courses ? nameEmailCourses.courses : memberInfo.courses;

  const canVoteDate = gracePeriodExpired
    ? addMonthsToDate(waitingPeriod, currDate)
    : currDate;

  const member = {
    username: memberInfo.username,
    name: name,
    email: email,
    courses: courses,
    registerDate: currDate,
    canVoteDate: canVoteDate,
    renewStartDate: addMonthsToDate(validPeriod, currDate),
    renewEndDate: addMonthsToDate(validPeriod + gracePeriod, currDate),
  }

  membersDatabase.updateMember(member);
};

module.exports = {
  getMember,
  registerMember,
  renovateMember,
};
