import { PostgresError } from "pg-error-enum";
import { getClient, isDatabaseException, query } from "../utils/database";
import type { Thesis, ThesisWithAreas } from "./dto";

const createTheses = async () => {
	try {
		await query(
			`CREATE TABLE theses(
        id integer PRIMARY KEY,
        title text,
        supervisors text[],
        vacancies integer,
        location text,
        observations text,
        objectives text,
        requirements text,
        area1 varchar(10) REFERENCES areas(code) ON DELETE CASCADE ON UPDATE CASCADE,
        area2 varchar(10) REFERENCES areas(code) ON DELETE CASCADE ON UPDATE CASCADE
      )`,
		);
	} catch (err) {
		if (isDatabaseException(err) && err.code === PostgresError.DUPLICATE_TABLE)
			console.log("Debug: theses already exists"); // table already exists
		else console.error(err);
	}
};

const setTheses = async (theses: ThesisWithAreas[]) => {
	const client = await getClient();
	try {
		await client.query("BEGIN");
		await client.query("TRUNCATE TABLE theses CASCADE");

		for (const thesis of theses) {
			await client.query(
				"INSERT INTO theses VALUES($1, $2, $3::text[], $4, $5, $6, $7, $8, $9, $10)",
				[
					thesis.id,
					thesis.title,
					thesis.supervisors,
					thesis.vacancies,
					thesis.location,
					thesis.observations,
					thesis.objectives,
					thesis.requirements,
					thesis.areas[0],
					thesis.areas[1],
				],
			);
		}

		await client.query("COMMIT");
	} catch (err) {
		await client.query("ROLLBACK");
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		console.error((err as any).stack);
	} finally {
		client.release();
	}
};

const getTheses = async () => {
	try {
		const thesesResult = await query<Thesis>("select * from theses");
		return thesesResult.rows;
	} catch (err) {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		console.error((err as any).message);
	}
};

export const thesesRepository = {
	createTheses,
	setTheses,
	getTheses,
};
