export interface Collaborator {
	id: number;
	username: string;
	campus: string;
	phone: string;
	teams: string;
	role: string;
	subRole: string;
	fromDate: Date;
	toDate: Date;
}

export interface CollaboratorMember {
	username: string;
	name: string;
	email: string;
	campus: string;
	role: string;
	subRole: string;
	teams: string;
}

export interface CollaboratorResume {
	name: string;
	teams: string;
}

export interface CollaboratorTeamMember {
	username: string;
	name: string;
	campus: string;
	teams: string;
}

export interface CollaboratorUsername {
	username: string;
}
