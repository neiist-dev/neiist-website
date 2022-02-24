const { productsDatabase } = require('../database');

const createProduct = async (product) => {
    productsDatabase.createProduct(product);
}

const getProducts = async () => {
    const products = productsDatabase.getProducts();
    return products;
}

module.exports = {
    createProduct,
    getProducts
};