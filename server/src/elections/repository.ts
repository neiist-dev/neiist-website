import { PostgresError } from "pg-error-enum";
import { isDatabaseException, query } from "../utils/database";
import type {
	CreateElectionDto,
	Election,
	ElectionWithOptions,
	Option,
	OptionWithVotes,
	Vote,
} from "./dto";

const createElections = async () => {
	try {
		await query(
			`CREATE TABLE elections(
        id serial PRIMARY KEY,
        name varchar(100),
        "startDate" date,
        "endDate" date
      )`,
		);
	} catch (err) {
		if (isDatabaseException(err) && err.code === PostgresError.DUPLICATE_TABLE)
			console.log("Debug: elections already exists"); // table already exists
		else console.error(err);
	}
};

const createOptions = async () => {
	try {
		await query(
			`CREATE TABLE options(
        id serial PRIMARY KEY,
        name varchar(100),
        "electionId" INTEGER REFERENCES elections(id) ON DELETE CASCADE ON UPDATE CASCADE
      )`,
		);
	} catch (err) {
		if (isDatabaseException(err) && err.code === PostgresError.DUPLICATE_TABLE)
			console.log("Debug: options already exists"); // table already exists
		else {
			console.error(err);
		}
	}
};

const createVotes = async () => {
	try {
		await query(
			`CREATE TABLE votes(
        username varchar(9),
        "electionId" INTEGER REFERENCES elections(id) ON DELETE CASCADE ON UPDATE CASCADE,
        "optionId" INTEGER REFERENCES options(id) ON DELETE CASCADE ON UPDATE CASCADE,
        PRIMARY KEY (username, "electionId")
      )`,
		);
	} catch (err) {
		if (isDatabaseException(err) && err.code === PostgresError.DUPLICATE_TABLE)
			console.log("Debug: votes already exists"); // table already exists
		else {
			console.error(err);
		}
	}
};

const addOption = async (electionId: number, optionName: string) => {
	try {
		return await query<Option[]>(
			'INSERT INTO options(name, "electionId") VALUES($1, $2)',
			optionName,
			electionId,
		);
	} catch (err) {
		console.error(err);
	}
};

const createElection = async (election: CreateElectionDto) => {
	try {
		const createdElectionResult = await query(
			'INSERT INTO elections(name, "startDate", "endDate") VALUES($1, $2, $3) RETURNING *',
			election.name,
			election.startDate,
			election.endDate,
		);
		const [createdElection] = createdElectionResult.rows;
		if (!createdElection) {
			throw new Error("Failed to create election");
		}

		const electionId = createdElection.id;
		for (const optionName of election.options) {
			await addOption(electionId, optionName);
		}
	} catch (err) {
		console.error(err);
	}
};

const getVotes = async (electionId: number, optionId: number) => {
	try {
		const votesResult = await query(
			`SELECT COUNT(*)
      FROM votes
      WHERE "electionId"=$1
      AND "optionId"=$2;`,
			electionId,
			optionId,
		);
		return (votesResult.rows[0]?.count as number) || 0;
	} catch (err) {
		console.error(err);
		return 0;
	}
};

const getOptions = async (electionId: number) => {
	try {
		const optionsResult = await query<Option>(
			'SELECT * FROM options WHERE "electionId"=$1',
			electionId,
		);
		const options = optionsResult.rows;
		return await Promise.all(
			options.map(
				async (option) =>
					({
						...option,
						votes: await getVotes(electionId, option.id),
					}) as OptionWithVotes,
			),
		);
	} catch (err) {
		console.error(err);
	}
};

const getActiveElections = async (currDate: Date) => {
	try {
		const electionsResult = await query<Election>(
			'SELECT * FROM elections WHERE $1 BETWEEN "startDate" AND "endDate" ',
			currDate,
		);
		const elections = electionsResult.rows;
		return await Promise.all(
			elections.map(
				async (election) =>
					({
						...election,
						options: await getOptions(election.id),
					}) as ElectionWithOptions,
			),
		);
	} catch (err) {
		console.error(err);
	}
};

const getAllElections = async () => {
	try {
		const electionsResult = await query<Election>("SELECT * FROM elections");
		const elections = electionsResult.rows;
		return await Promise.all(
			elections.map(
				async (election) =>
					({
						...election,
						options: await getOptions(election.id),
					}) as ElectionWithOptions,
			),
		);
	} catch (err) {
		console.error(err);
	}
};

const createVote = async (electionId: number, vote: Vote) => {
	try {
		await query(
			"INSERT INTO votes values($1, $2, $3)",
			vote.username,
			electionId,
			vote.optionId,
		);
	} catch (err) {
		console.error(err);
	}
};

export const electionsRepository = {
	createElections,
	createOptions,
	createVotes,
	createElection,
	getActiveElections,
	getAllElections,
	createVote,
	addOption,
	getOptions,
	getVotes,
};
