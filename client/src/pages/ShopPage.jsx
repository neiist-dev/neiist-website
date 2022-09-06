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

const ProductCard = ({ name, price }) => {

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const imagePath = name.replace(/\s+/g, '').concat(".png");

    //TODO: Fix image size!
    return (
        <>
            <Card style={{ width: '20rem', margin: "1em" }} onClick={handleShow}>
                <Card.Img variant="top" src={images[imagePath]} height="300em"/> 
                <Card.Body>
                    <Card.Title>{name}</Card.Title>
                </Card.Body>
            </Card>
            <ProductModal
                name={name}
                image={imagePath}
                price={price}
                show={show}
                handleClose={handleClose}
            />
        </>
    );
}

const ProductModal = ({ name, image, price, show, handleClose }) => {

    const [sizes, setSizes] = useState([]);
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        fetch(`/api/products/${name}`)
            .then((res) => res.json())
            .then(
                (sizesRes) => {
                    setSizes(sizesRes);
                    setIsLoaded(true);
                },
                (err) => {
                    setIsLoaded(true);
                    setError(err);
                },
            );
    }, []);

    // const [price, setPrice] = useState(product.price); PUT ON ADMIN!!!

    return (
        <Modal size="lg" show={show} centered>
            <Modal.Header closeButton onClick={handleClose}>
                <Modal.Title>{name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    <Col>
                        <img src={images[image].default} className="img-fluid" />
                    </Col>
                    <Col>
                        <FormSelect aria-label="Tamanho">
                            {sizes.map((size) => <option key={size.id} value={size.size}>{size.size}</option>)}
                        </FormSelect>
                    </Col>
                    <Col>
                        <h4>Preço</h4>
                        <p>{price} €</p>
                        <h4>Quantidade</h4>
                        <input></input>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button>Adicionar ao cesto</Button>
            </Modal.Footer>
        </Modal>
    );
};

//product = {name: XXXX, price: XXXX}
//sweat = {name: XXXX, size: XXXX, stock: XXXX}
const createProduct = () => {
    let product1 = {
        name: "Sweat Azul",
        size: "L",
        price: 15.70
    }
    let product2 = {
        name: "Sweat Azul",
        size: "M",
        price: 15.70
    }
    let product3 = {
        name: "Sweat Vermelha",
        size: "M",
        price: 15.70
    }
    let product4 = {
        name: "Sweat Beje",
        size: "XS",
        price: 15.70
    }
    let product5 = {
        name: "Sweat Vermelha",
        size: "XL",
        price: 15.70
    }
    let product6 = {
        name: "Sweat Cor-de-Rosa",
        size: "XS",
        price: 15.70
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
        fetch(`/api/products`)
            .then((res) => res.json())
            .then(
                (productsRes) => {
                    createProduct();
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

        console.log(products);

        return (
            <div style={{ margin: '2rem 20vw 1rem 20vw' }}>
                <h2 style={{ textAlign: 'center' }}>Sweats EIC</h2>
                <Row>
                    {products.map((product) => (
                        <Col key={product.id}>
                            <ProductCard
                                name={product.name}
                                price={product.price}
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