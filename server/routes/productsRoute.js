const express = require('express');
const { productsService } = require('../services');

const router = express.Router();

router.use(express.json());

router.post('/', async (req) => {
    await productsService.createProduct(req.body);
});

router.get('/', async (req, res) => {
    const products = await productsService.getProducts();
    res.json(products);
});

router.get('/:name', async (req, res) => {
    const { name } = req.params;
    const product = await productsService.getProduct(name);
    res.json(product);
});

module.exports = router;