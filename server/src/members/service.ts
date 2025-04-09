import type { Member, MemberBase, MemberInfo, NameEmailCourses } from "./dto";
import { membersRepository } from "./repository";

const waitingPeriod = 4;
const validPeriod = 12;
const gracePeriod = 6;
const dateColumns = [
	"registerDate",
	"canVoteDate",
	"renewStartDate",
	"renewEndDate",
] as const;

/* Dates */
const formatDate = (date: Date) =>
	new Date(date).toLocaleDateString("pt-pt").split(",")[0];

const addMonthsToDate = (numMonths: number, date: Date) => {
	const newMonth = date.getMonth() + numMonths;
	const newDate = new Date(date);
	newDate.setMonth(newMonth);
	return newDate;
};

const subMonthsToDate = (numMonths: number, date: Date) => {
	const newMonth = date.getMonth() - numMonths;
	const newDate = new Date(date);
	newDate.setMonth(newMonth);
	return newDate;
};

/* Status of Member */
const canMemberVote = (currDate: Date, member: Member) =>
	currDate >= member.canVoteDate && currDate < member.renewStartDate;

const hastoRenew = (currDate: Date, member: Member) =>
	currDate >= member.renewStartDate && currDate <= member.renewEndDate;

const isMemberExpired = (currDate: Date, member: Member) =>
	currDate > member.renewEndDate;

const getStatus = (member: Member, currDate = new Date()) => {
	const canVote = canMemberVote(currDate, member);
	const renew = hastoRenew(currDate, member);
	const expired = isMemberExpired(currDate, member);

	// If member isn't registed in database, frontEnd returns "NaoSocio"
	if (!canVote && !renew && !expired) return "SocioRegular";
	if (canVote && !renew && !expired) return "SocioEleitor";
	if (renew && !expired) return "Renovar";
	return "NaoSocio";
};

const getMember = async (username: string) => {
	const memberInfo = await membersRepository.getMember(username);
	if (!memberInfo) return null;

	const ret: Partial<MemberInfo> = {
		...(memberInfo as MemberBase),
		status: getStatus(memberInfo),
	};

	for (const date of dateColumns) {
		ret[date] = formatDate(memberInfo[date]);
	}

	return ret as MemberInfo;
};

const getMemberStatus = async (username: string) => {
	const memberInfo = await membersRepository.getMember(username);
	if (!memberInfo) return "NaoSocio";

	return getStatus(memberInfo);
};

const getActiveMembers = async () => {
	const currDate = new Date();
	const limitDate = subMonthsToDate(validPeriod + gracePeriod, currDate);

	const activeMembers = await membersRepository.getActiveMembers(
		currDate,
		limitDate,
	);
	if (!activeMembers) return null;

	return activeMembers.map((member) => {
		const ret: Partial<MemberInfo> = {
			...(member as MemberBase),
			status: getStatus(member),
		};

		for (const date of dateColumns) {
			ret[date] = formatDate(member[date]);
		}

		return ret as MemberInfo;
	});
};

const getAllMembers = async () => {
	const allMembers = await membersRepository.getAllMembers();
	if (!allMembers) return null;

	return allMembers.map((member) => {
		const ret: Partial<MemberInfo> = {
			...(member as MemberBase),
			status: getStatus(member),
		};

		for (const date of dateColumns) {
			ret[date] = formatDate(member[date]);
		}

		return ret as MemberInfo;
	});
};

const getRenewMembersWarned = async () => {
	return await membersRepository.getRenewalNotifications();
};

const addRenewMemberWarned = async (username: string) => {
	return await membersRepository.addRenewalNotification(username);
};

const registerMember = async (member: Member) => {
	const currDate = new Date();
	const canVoteDate = addMonthsToDate(waitingPeriod, currDate);
	const renewStartDate = addMonthsToDate(validPeriod, currDate);
	const renewEndDate = addMonthsToDate(validPeriod + gracePeriod, currDate);

	const newMember = member;
	newMember.registerDate = currDate;
	newMember.canVoteDate = canVoteDate;
	newMember.renewStartDate = renewStartDate;
	newMember.renewEndDate = renewEndDate;

	await membersRepository.createMember(newMember);
	await membersRepository.removeRenewalNotification(newMember.username);
};

const renovateMember = async (
	username: string,
	nameEmailCourses: NameEmailCourses,
) => {
	const memberInfo = await membersRepository.getMember(username);
	if (!memberInfo) return null;

	const currDate = new Date();
	const gracePeriodExpired = isMemberExpired(currDate, memberInfo);

	// changed in fenix OR if column in database = null
	const name =
		nameEmailCourses.name !== memberInfo.name
			? nameEmailCourses.name
			: memberInfo.name;
	const email =
		nameEmailCourses.email !== memberInfo.email
			? nameEmailCourses.email
			: memberInfo.email;
	const courses =
		nameEmailCourses.courses !== memberInfo.courses
			? nameEmailCourses.courses
			: memberInfo.courses;

	const canVoteDate = gracePeriodExpired
		? addMonthsToDate(waitingPeriod, currDate)
		: currDate;

	const member: Member = {
		username: memberInfo.username,
		name: name,
		email: email,
		courses: courses,
		registerDate: currDate,
		canVoteDate: canVoteDate,
		renewStartDate: addMonthsToDate(validPeriod, currDate),
		renewEndDate: addMonthsToDate(validPeriod + gracePeriod, currDate),
	};

	await membersRepository.updateMember(member);
	await membersRepository.removeRenewalNotification(member.username);
};

const updateEmailMember = async (username: string, newEmail: string) => {
	const memberInfo = await membersRepository.getMember(username);
	if (!memberInfo) return null;

	memberInfo.email = newEmail;
	await membersRepository.updateMember(memberInfo);
};

const removeMember = async (username: string) => {
	//Removing a member is the same as renewDate being equal to today
	const memberInfo = await membersRepository.getMember(username);
	if (!memberInfo) return null;

	const currDate = new Date();

	memberInfo.renewStartDate = currDate;
	memberInfo.renewEndDate = currDate;

	await membersRepository.updateMember(memberInfo);
	await membersRepository.removeRenewalNotification(memberInfo.username);
};

export const membersService = {
	getMember,
	getActiveMembers,
	getMemberStatus,
	getAllMembers,
	getRenewMembersWarned,
	addRenewMemberWarned,
	registerMember,
	renovateMember,
	removeMember,
	updateEmailMember,
};
