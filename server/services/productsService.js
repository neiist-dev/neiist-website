const { productsDatabase } = require('../database');

const getProducts = async () => {
    // Fake data, should query db
    // const products = productsDatabase.getProducts();
    const products = [
        {
            name:"Sweat Azul",
            image:"/sweatAzul.png",
            path:"/shop/sweatAzul"
        },
        {
            name:"Sweat Vermelha",
            image:"/sweatVermelha.png",
            path:"/shop/sweatVermelha"
        }
    ];
    return products;
}

module.exports = {
    getProducts
};