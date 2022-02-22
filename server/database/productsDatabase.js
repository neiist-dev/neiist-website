const db = require('./database');

// Still working on it ...

const createProducts = async () => {
    try {
        await db.query(
          `CREATE TABLE products()`,
        );
      } catch (err) {
        if (err.code === '42P07') ; // table already exists
        else { console.error(err); }
      }
}

module.exports = {
  createProducts,
};