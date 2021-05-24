const { query } = require('express');
const { Pool } = require('pg');
const areas = require('./data/meic_areas.json')
const theses = require('./data/meic_theses.json')

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    password: '0000',
    port: 5432,
    database: 'neiistdb',
});

module.exports = pool;

async function populateAreas() {
    const client = await pool.connect();

    try{
        await client.query("begin");
        await client.query("truncate table areas cascade");
        for(let i = 0; i < areas.length; i++)
            await client.query("insert into areas values($1, $2, $3)", [areas[i].code, areas[i].short, areas[i].long]);
        await client.query("commit");
    }
    catch(err) {
        await client.query("rollback");
        console.log(error);
    }
    finally {
        client.release();
    }
}

async function populateTheses() {
    const client = await pool.connect();
    try{
        await client.query("begin");
        await client.query("truncate table theses cascade");
        for(let i = 0; i < theses.length; i++) {
            await client.query("insert into theses values($1, $2, $3::text[], $4, $5, $6, $7, $8, $9, $10)",
            [theses[i].id, theses[i].title, theses[i].supervisors, theses[i].vacancies, theses[i].location, theses[i].observations, theses[i].objectives, theses[i].requirements, theses[i].areas[0], theses[i].areas[1]]);
        }
        await client.query("commit");
    }
    catch(err) {
        await client.query("rollback");
        console.error(err.stack);
    }
    finally {
        client.release();
    }
}

async function populatedb() {
    await populateAreas();
    await populateTheses();
    console.log("database populated")
}
//uncomment this to populate db
// populatedb();
