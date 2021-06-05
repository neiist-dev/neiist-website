const Pool = require('pg').Pool
const pool = new Pool()

const createTableAreas = async () => {
    const client = await pool.connect();
    try {
        await client.query("begin");
        //await client.query("truncate table theses cascade");
        // DROP TABLE IF EXISTS areas CASCADE;
        // CREATE TABLE areas(
        //     code varchar(10) PRIMARY KEY,
        //     short varchar(10),
        //     long varchar(100)
        // );
        await client.query("commit");
    }
    catch (err) {
        await client.query("rollback");
        console.error(err.stack);
    }
    finally {
        client.release();
    }
}

const createTableTheses = async () => {
    const client = await pool.connect();
    try {
        await client.query("begin");
        //await client.query("truncate table theses cascade");
        // DROP TABLE IF EXISTS theses CASCADE;
        // CREATE TABLE theses(
        //     id integer PRIMARY KEY,
        //     title text,
        //     supervisors text[],
        //     vacancies integer,
        //     location text,
        //     observations text,
        //     objectives text,
        //     requirements text,
        //     area1 varchar(10) REFERENCES areas(code) ON DELETE CASCADE ON UPDATE CASCADE,
        //     area2 varchar(10) REFERENCES areas(code) ON DELETE CASCADE ON UPDATE CASCADE
        // );
        await client.query("commit");
    }
    catch (err) {
        await client.query("rollback");
        console.error(err.stack);
    }
    finally {
        client.release();
    }
}

const createTables = () => {
    createTableAreas()
    createTableTheses()
}

createTables()