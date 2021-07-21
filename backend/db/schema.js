const db = require('./schemaQueries')
const path = require('path')
require('dotenv').config({
    path: path.resolve(__dirname, `../config/.env.${process.env.NODE_ENV}`)
});

db.createTables()