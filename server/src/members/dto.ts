export interface MemberBase {
	username: string;
	name: string;
	email: string;
	courses: string;
}

export interface Member extends MemberBase {
	registerDate: Date;
	canVoteDate: Date;
	renewStartDate: Date;
	renewEndDate: Date;
}

export interface MemberInfo extends MemberBase {
	status: string;
	registerDate: string;
	canVoteDate: string;
	renewStartDate: string;
	renewEndDate: string;
}

export interface NameEmailCourses {
	name: string;
	email: string;
	courses: string;
}
