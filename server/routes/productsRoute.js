const express = require('express');
const { productsService } = require('../services');

const router = express.Router();

router.use(express.json());

router.get('/',async (req, res) => {
    const products = await productsService.getProducts();
    res.json(products);
});

module.exports = router;