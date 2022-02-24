const db = require('./database');

const createProducts = async () => {
  try {
    await db.query(
      `CREATE TABLE products(
                id serial PRIMARY KEY,
                name varchar(100),
                size varchar(20),
                price float,
                stock integer
            )`,
    );
  } catch (err) {
    if (err.code === '42P07'); // table already exists
    else { console.error(err); }
  }
}

const createProduct = async (product) => {
  try {
    await db.query(
      'INSERT INTO products(name, size, price, stock) VALUES($1, $2, $3, $4)',
      [product.name, product.size, product.price, product.stock]
    );
  } catch (err) {
    console.error(err);
  }
}

const updateProduct = async (product) => {
  try {
    await db.query(
      'UPDATE products SET name = $1, size = $2, price = $3, stock = $4',
      [product.name, product.size, product.price, product.stock]
    );
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