const Pool = require('pg').Pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    password: '123',
    port: 5432,
    database: 'neiistdb',
})

const setTheses = async theses => {
    const client = await pool.connect();
    try {
        await client.query("begin");
        await client.query("truncate table theses cascade");
        for (let thesis of theses) {
            await client.query("insert into theses values($1, $2, $3::text[], $4, $5, $6, $7, $8, $9, $10)",
                [thesis.id, thesis.title, thesis.supervisors, thesis.vacancies, thesis.location, thesis.observations, thesis.objectives, thesis.requirements, thesis.areas[0], thesis.areas[1]]);
        }
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

const getThesisById = async id => {
    const client = await pool.connect();
    try {
        const thesis = await client.query("select * from theses where id = $1", [id])
        return thesis.rows[0]
    }
    catch (err) {
        console.error(err.message);
    }
    finally {
        client.release();
    }
}

const getThesesByAreas = async (area1, area2) => {
    const client = await pool.connect();
    try {
        let theses
        if (area1 !== undefined && area2 !== undefined)
            theses = await client.query("select * from theses where area1 = $1 or area2 = $1 or area1 = $2 or area2 = $2", [area1, area2]);
        else if (area1 !== undefined) theses = await client.query("select * from theses where area1 = $1 or area2 = $1", [area1]);
        else if (area2 !== undefined) theses = await client.query("select * from theses where area1 = $1 or area2 = $1", [area2]);
        else theses = await client.query("select * from theses");

        return theses.rows
    }
    catch (err) {
        console.error(err.message);
    }
    finally {
        client.release();
    }
}

const setAreas = async areas => {
    const client = await pool.connect();
    try {
        await client.query("begin");
        await client.query("truncate table areas cascade");
        for (let area of areas)
            await client.query("insert into areas values($1, $2, $3)", [area.code, area.short, area.long]);
        await client.query("commit");
    }
    catch (err) {
        await client.query("rollback");
        console.log(error);
    }
    finally {
        client.release();
    }
}

const getAreas = async areas => {
    const client = await pool.connect();
    try {
        const allAreas = await client.query("select * from areas");
        return allAreas.rows;
    }
    catch (err) {
        console.error(err.message);
    }
    finally {
        client.release();
    }
}

module.exports = {
    setTheses: setTheses,
    getThesisById: getThesisById,
    getThesesByAreas: getThesesByAreas,
    setAreas: setAreas,
    getAreas: getAreas
}
