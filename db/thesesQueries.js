const Pool = require('pg').Pool
const pool = new Pool()

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

const getThesesByAreas = async areas => {
    const client = await pool.connect();
    
    try {
        if(!areas) {
            const theses = await client.query("select * from theses");
            return theses.rows
        }

        else if (areas.length === 1) {
            const area = areas[0]
            const theses = await client.query("select * from theses where area1 = $1 or area2 = $1", [area])
            return theses.rows
        }

        else if (areas.length === 2) {
            const area1 = areas[0]
            const area2 = areas[1]
            theses = await client.query("select * from theses where area1 = $1 or area2 = $1 or area1 = $2 or area2 = $2", [area1, area2])
            return theses.rows
        }

        else
            console.error("can only handle 0, 1 or 2 areas");
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
}
