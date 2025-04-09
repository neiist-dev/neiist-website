import type { Collaborator } from "../collaborators/dto";

export interface UserData {
	username: string;
	displayName: string;
	name: string;
	email: string;
	courses: string;
	status: string;
	isActiveTecnicoStudent: boolean;
	isActiveLMeicStudent: boolean;
	isAdmin: boolean;
	isGacMember: boolean;
	isMember: boolean;
	isCollab: Collaborator | false;
	isCoordinator: boolean;
}

/**
 * https://fenixedu.org/dev/api/#get-person
 */
export interface FenixPerson {
	roles: FenixRole[];
	campus: string;
	photo: FenixPhoto;
	name: string;
	gender: string;
	birthday: string;
	username: string;
	email: string;
	personalEmails: string[];
	institutionalEmail: string;
	workEmails: string[];
	webAddresses: string[];
	workWebAddresses: string[];
	displayName: string;
}

export interface FenixRole {
	type: FenixRoleType;
	department?: FenixDepartment;
	registrations?: FenixRegistration[];
	concludedRegistrations?: FenixRegistration[];
}

export interface FenixDepartment {
	name: string;
	acronym: string;
}

export interface FenixRegistration {
	name: string;
	acronym: string;
	id: string;
	academicTerms: string[];
}

export interface FenixPhoto {
	type: string;
	data: string;
}

export enum FenixRoleType {
	STUDENT = "STUDENT",
	TEACHER = "TEACHER",
	ALUMNI = "ALUMNI",
	STAFF = "STAFF",
	GRANT_OWNER = "GRANT_OWNER",
}
