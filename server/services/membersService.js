const { membersDatabase } = require('../database');

const waitingPeriod = 4;
const validPeriod = 12;
const gracePeriod = 6;
const dateColumns = ['registerDate', 'canVoteDate', 'renewStartDate', 'renewEndDate'];

/* Dates */
const formatDate = (date) => 
  new Date(date).toLocaleDateString('pt-pt').split(',')[0];

const addMonthsToDate = (numMonths, date) => {
  const newMonth = date.getMonth() + numMonths;
  const newDate = new Date(date);
  newDate.setMonth(newMonth);
  return newDate;
};

const subMonthsToDate = (numMonths, date) => {
  const newMonth = date.getMonth() - numMonths;
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

const getStatus = (member, currDate = new Date()) => {
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

  memberInfo.status = getStatus(memberInfo);
  dateColumns.forEach( (date) => memberInfo[date] = formatDate(memberInfo[date]) );

  return memberInfo;
};

const getMemberStatus = async (username) => {
  const memberInfo = await membersDatabase.getMember(username);
  if (!memberInfo) return "NaoSocio";

  return getStatus(memberInfo);;
};

const getActiveMembers = async () => {
  const currDate = new Date();
  const limitDate = subMonthsToDate(validPeriod + gracePeriod, currDate);

  var activeMembers = await membersDatabase.getActiveMembers(currDate, limitDate);
  if (!activeMembers) return null;
  
  activeMembers
    .forEach( member => {
      member.status = getStatus(member);
      dateColumns.forEach((date) => member[date] = formatDate(member[date]));
    });

  return activeMembers;
};

const getAllMembers = async () => {
  var allMembers = await membersDatabase.getAllMembers();
  if (!allMembers) return null;
  
  allMembers
    .forEach( member => {
      member.status = getStatus(member);
      dateColumns.forEach((date) => member[date] = formatDate(member[date]));
    });

  return allMembers;
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

const updateEmailMember = async (username, newEmail) => {
  const memberInfo = await membersDatabase.getMember(username);
  memberInfo.email = newEmail;
  membersDatabase.updateMember(memberInfo);
};

const removeMember = async (username) => {
  //Removing a member is the same as renewDate being equal to today
  const memberInfo = await membersDatabase.getMember(username);
  const currDate = new Date();

  memberInfo.renewStartDate = currDate;
  memberInfo.renewEndDate = currDate;

  membersDatabase.updateMember(memberInfo);
};

module.exports = {
  getMember,
  getActiveMembers,
  getMemberStatus,
  getAllMembers,
  registerMember,
  renovateMember,
  removeMember,
  updateEmailMember,
};
