import { PostgresError } from "pg-error-enum";
import { isDatabaseException, query } from "../utils/database";
import type { Member } from "./dto";

const createMembers = async () => {
	try {
		await query(
			`CREATE TABLE members(
        "username" varchar(10) PRIMARY KEY,
        "name" varchar(255),
        "email" varchar(255),
        "courses" varchar(33),
        "registerDate" date,
        "canVoteDate" date,
        "renewStartDate" date,
        "renewEndDate" date
      )`,
		);
	} catch (err) {
		if (isDatabaseException(err) && err.code === PostgresError.DUPLICATE_TABLE)
			console.log("Debug: members already exists"); // table already exists
		else console.error(err);
	}
};

const createRenewalNotifications = async () => {
	try {
		await query(
			`CREATE TABLE "renewalNotifications" (
        "username" varchar(10) PRIMARY KEY,
        FOREIGN KEY (username) REFERENCES members(username)
      )`,
		);
		await createRenewalNotificationsTrigger();
	} catch (err) {
		if (isDatabaseException(err) && err.code === PostgresError.DUPLICATE_TABLE)
			console.log("Debug: renewalNotifications already exists"); // table already exists
		else console.error(err);
	}
};

const createRenewalNotificationsTrigger = async () => {
	try {
		await query(
			`CREATE OR REPLACE FUNCTION remove_expired_warned_users() RETURNS TRIGGER AS $$
      BEGIN
        DELETE FROM "renewalNotifications"
        WHERE username IN (SELECT username FROM members WHERE "renewEndDate" < CURRENT_DATE);
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER remove_expired_warned_users_trigger
      AFTER INSERT OR UPDATE ON "renewalNotifications"
      FOR EACH ROW
      EXECUTE FUNCTION remove_expired_warned_users();
      `,
		);
	} catch (err) {
		console.error(err);
	}
};

const createMember = async (member: Member) => {
	try {
		await query(
			"INSERT INTO members VALUES($1, $2, $3, $4, $5, $6, $7, $8)",
			member.username,
			member.name,
			member.email,
			member.courses,
			member.registerDate,
			member.canVoteDate,
			member.renewStartDate,
			member.renewEndDate,
		);
	} catch (err) {
		console.error(err);
	}
};

const updateMember = async (member: Member) => {
	try {
		await query(
			'UPDATE members SET "name" = $1, "email" = $2, "courses" = $3, "registerDate" = $4::date, "canVoteDate" = $5::date, "renewStartDate" = $6::date, "renewEndDate" = $7::date WHERE "username" = $8',
			member.name,
			member.email,
			member.courses,
			member.registerDate,
			member.canVoteDate,
			member.renewStartDate,
			member.renewEndDate,
			member.username,
		);
	} catch (err) {
		console.error(err);
	}
};

const getMember = async (username: string) => {
	try {
		const memberResult = await query<Member>(
			'SELECT * FROM members WHERE "username" = $1',
			username,
		);
		return memberResult.rows[0];
	} catch (err) {
		console.error(err);
	}
};

const getActiveMembers = async (currDate: Date, limitDate: Date) => {
	try {
		const activeMembersResult = await query<Member>(
			'SELECT * FROM members \
        WHERE "registerDate" > $1::date AND "renewEndDate" > $2::date \
        ORDER BY length(username), username',
			limitDate,
			currDate,
		);
		return activeMembersResult.rows;
	} catch (err) {
		console.error(err);
	}
};

const getAllMembers = async () => {
	try {
		const allMembersResult = await query<Member>(
			"SELECT * FROM members ORDER BY length(username), username",
		);
		return allMembersResult.rows;
	} catch (err) {
		console.error(err);
	}
};

const getRenewalNotifications = async () => {
	try {
		const memberResult = await query<Member>(
			'SELECT * FROM "renewalNotifications"',
		);
		return memberResult.rows;
	} catch (err) {
		console.error(err);
	}
};

const addRenewalNotification = async (username: string) => {
	try {
		await query('INSERT INTO "renewalNotifications" VALUES ($1)', username);
	} catch (err) {
		console.error(err);
	}
};

const removeRenewalNotification = async (username: string) => {
	try {
		await query(
			'DELETE FROM "renewalNotifications" WHERE "username" = $1',
			username,
		);
	} catch (err) {
		console.error(err);
	}
};

export const membersRepository = {
	createMembers,
	createMember,
	updateMember,
	getMember,
	getActiveMembers,
	getAllMembers,
	createRenewalNotifications,
	addRenewalNotification,
	removeRenewalNotification,
	getRenewalNotifications,
};
