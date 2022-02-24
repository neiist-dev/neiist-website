const db = require('./database');

// Still working on it ...

const createProducts = async () => {
  try {
    await db.query(
      `CREATE TABLE products(
                id serial PRIMARY KEY,
                name varchar(100),
                price float
            )`,
    );
  } catch (err) {
    if (err.code === '42P07'); // table already exists
    else { console.error(err); }
  }
}

const createProduct = async (product) => {
  try {
    await db.query('INSERT INTO products(name, price) VALUES($1, $2)', [product.name, product.price]);
  } catch (err) {
    console.error(err);
  }
}

const updateProduct = async (product) => {
  try {
    await db.query('UPDATE products SET name = $1, price = $2', [product.name, product.price]);
  } catch (err) {
    console.error(err);
  }
}

const getProducts = async () => {
  let products;
  try {
    const productsResult = await db.query('SELECT * FROM products');
    products = productsResult.rows;
  } catch (err) {
    console.error(err);
  }
  return products
}

module.exports = {
  createProducts,
  createProduct,
  updateProduct,
  getProducts,
};