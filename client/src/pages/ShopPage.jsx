import axios from 'axios';
import React, { useState, useEffect } from 'react';

import { Card, Modal, FormSelect, Row, Col, Button } from 'react-bootstrap';

// Not sure if needed, couldn't display image without this
// Tried using src={require(imagePath)} but got error about not finding module
function importAll(r) {
    let images = {};
    r.keys().map((item) => { images[item.replace('./', '')] = r(item); });
    return images;
}
const images = importAll(require.context('../images/products', false, /\.(png)$/));

const ProductCard = ({ product, sizes }) => {

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const imagePath = product.name.replace(/\s+/g, '').concat(".png");

    return (
        <>
            <Card style={{ width: '20rem', margin: "1em" }} onClick={handleShow}>
                <Card.Img variant="top" src={images[imagePath].default} width={"300em"} height={"300em"}/>
                <Card.Body>
                    <Card.Title>{product.name}</Card.Title>
                </Card.Body>
            </Card>
            <ProductModal
                product={product}
                sizes={sizes}
                image={imagePath}
                show={show}
                handleClose={handleClose}
            />
        </>
    );
}

const ProductModal = ({ product, sizes, image, show, handleClose }) => {

    let dropdown = null;
    const [price, setPrice] = useState(product.price);

    if (sizes.length > 0) {
        dropdown =
            <FormSelect aria-label="Tamanho" onChange={(value) => setPrice(value)}>
                {sizes.map((size) => <option key={size.id} value={size.size}>{size.size}</option>)}
            </FormSelect>
    }

    return (
        <Modal size="lg" show={show} centered>
            <Modal.Header closeButton onClick={handleClose}>
                <Modal.Title>{product.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    <Col>
                        <img src={images[image].default} className="img-fluid" />
                    </Col>
                    <Col>
                        {dropdown}
                    </Col>
                    <Col>
                        <h4>Preço</h4>
                        <p>{product.price}</p>
                        <h4>Quantidade</h4>
                        <input></input>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button>Order</Button>
            </Modal.Footer>
        </Modal>
    );
};

const createProduct = () => {
    let product1 = {
        name: "Sweat Azul",
        size: "L",
        price: 15.70,
        stock: 16
    }
    let product2 = {
        name: "Sweat Azul",
        size: "M",
        price: 15.70,
        stock: 10
    }
    let product3 = {
        name: "Sweat Vermelha",
        size: "M",
        price: 15.70,
        stock: 5
    }
    let product4 = {
        name: "Sweat Beje",
        size: "XS",
        price: 15.70,
        stock: 2
    }
    let product5 = {
        name: "Sweat Vermelha",
        size: "XL",
        price: 15.70,
        stock: 3
    }
    let product6 = {
        name: "Sweat Cor-de-Rosa",
        size: "XS",
        price: 15.70,
        stock: 2
    }

    axios.post('/api/products', product1);
    axios.post('/api/products', product2);
    axios.post('/api/products', product3);
    axios.post('/api/products', product4);
    axios.post('/api/products', product5);
    axios.post('/api/products', product6);
}

const ShopPage = () => {

    const [products, setProducts] = useState(null);
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        fetch('/api/products')
            .then((res) => res.json())
            .then(
                (productsRes) => {
                    //createProduct();
                    setProducts(productsRes);
                    setIsLoaded(true);
                },
                (err) => {
                    setIsLoaded(true);
                    setError(err);
                },
            );
    }, []);

    if (!isLoaded) return <div>...</div>;
    if (error) {
        return (
            <div>
                Erro:
                {error.message}
            </div>
        );
    }
    if (products) {

        // Remove 'duplicate' products with same name but different size
        const uniqueProducts = [...new Map(
            products.map(item => [item["name"], item])
        ).values()];

        return (
            <div style={{ margin: '2rem 20vw 1rem 20vw' }}>
                <h2 style={{ textAlign: 'center' }}>Sweats EIC</h2>
                <Row>
                    {uniqueProducts.map((uniqueProduct) => (
                        <Col>
                            <ProductCard
                                key={uniqueProduct.id}
                                product={uniqueProduct}
                                sizes={products.filter(
                                    (product) => { if (product.name == uniqueProduct.name) return product }
                                )}
                            />
                        </Col>
                    ))}    
                </Row>
            </div>
        );
    }
    return <div>Não foi possível carregar os produtos.</div>;
}

export default ShopPage;