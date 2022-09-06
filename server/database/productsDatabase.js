const db = require('./database');

const createProducts = async () => {
  try {
    await db.query(
      `CREATE TABLE products(
                id serial PRIMARY KEY,
                name varchar(100) NOT NULL,
                size varchar(20) NOT NULL,
                price decimal(5,2) NOT NULL,
                constraint products_unique UNIQUE (name, size)
            )`,
    );
  } catch (err) {
    if (err.code === '42P07'); // table already exists
    else { console.error(err); }
  }
}

const createOrders = async () => {
  try {
    await db.query(
      `CREATE TABLE orders(
                id serial PRIMARY KEY,
                person_name varchar(200) NOT NULL,
                email varchar(200) NOT NULL,
                ist_id varchar(20) NOT NULL
            )`,
    );
  } catch (err) {
    if (err.code === '42P07'); // table already exists
    else { console.error(err); }
  }
}

const createOrderContents = async () => {
  try {
    await db.query(
      `CREATE TABLE order_contents(
                order_id int NOT NULL,
                product_id int NOT NULL,
                quantity int NOT NULL,
                CONSTRAINT order_contents_unique UNIQUE (order_id, product_id)
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
      'INSERT INTO products(name, size, price) VALUES($1, $2, $3) ON CONFLICT DO NOTHING',
      [product.name, product.size, product.price]
    );
  } catch (err) {
    console.error(err);
  }
}

const updateProduct = async (product) => {
  try {
    await db.query(
      'UPDATE products SET name = $1, size = $2, price = $3',
      [product.name, product.size, product.price]
    );
  } catch (err) {
    console.error(err);
  }
}

const getProducts = async () => {
  let products;
  try {
    const productsResult = await db.query('SELECT DISTINCT name, price FROM products');
    products = productsResult.rows;
  } catch (err) {
    console.error(err);
  }
  return products
}

const getProduct = async (name) => {
  let product;
  try {
    const productResult = await db.query('SELECT size FROM products WHERE name = $1', [name]);
    product = productResult.rows;
  } catch (err) {
    console.error(err);
  }
  return product;
}

// TODO: Make delete functions

module.exports = {
  createProducts,
  createOrders,
  createOrderContents,
  createProduct,
  updateProduct,
  getProducts,
  getProduct
};