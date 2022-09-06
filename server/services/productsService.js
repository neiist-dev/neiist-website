const { productsDatabase } = require('../database');

const createProduct = async (product) => {
    productsDatabase.createProduct(product);
}

const getProducts = async () => {
    const products = productsDatabase.getProducts();
    return products;
}

const getProduct = async (name) => {
    const product = productsDatabase.getProduct(name);
    return product;
}

module.exports = {
    createProduct,
    getProducts,
    getProduct
};