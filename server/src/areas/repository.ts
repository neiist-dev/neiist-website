import { PostgresError } from "pg-error-enum";
import { getClient, isDatabaseException, query } from "../utils/database";
import type { Area } from "./dto";

const createAreas = async () => {
	try {
		await query(
			`CREATE TABLE areas (
        code varchar(10) PRIMARY KEY,
        short varchar(10),
        long varchar(100)
      )`,
		);
	} catch (err) {
		if (isDatabaseException(err) && err.code === PostgresError.DUPLICATE_TABLE)
			console.log("Debug: areas already exists"); // table already exists
		else console.error(err);
	}
};

const setAreas = async (areas: Area[]) => {
	const client = await getClient();
	try {
		await client.query("BEGIN");
		await client.query("TRUNCATE TABLE areas CASCADE");

		await Promise.all(
			areas.map(async (area) => {
				await client.query("INSERT INTO areas VALUES($1, $2, $3)", [
					area.code,
					area.short,
					area.long,
				]);
			}),
		);

		await client.query("COMMIT");
	} catch (err) {
		await client.query("ROLLBACK");
		console.error(err);
	} finally {
		client.release();
	}
};

const getAreas = async () => {
	try {
		const areasResult = await query<Area>("SELECT * FROM areas");
		return areasResult.rows;
	} catch (err) {
		console.error(err);
		return [] as Area[];
	}
};

export const areasRepository = {
	createAreas,
	setAreas,
	getAreas,
};
