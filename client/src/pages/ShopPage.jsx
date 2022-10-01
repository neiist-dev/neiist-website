import axios from 'axios';
import React, { useState, useEffect } from 'react';

import { Card, Modal, FormSelect, Row, Col, Button, Carousel } from 'react-bootstrap';

// Not sure if needed, couldn't display image without this
// Tried using src={require(imagePath)} but got error about not finding module
function importAll(r) {
    let images = {};
    r.keys().map((item) => { images[item.replace('./', '')] = r(item); });
    return images;
}
const images = importAll(require.context('../images/products', false, /\.(png)$/));

// Available products
// Sweats:
const sweatColors = ["Sweat Azul", "Sweat Vermelha", "Sweat Beje", "Sweat Cor-de-Rosa"];
const sweatSizes = ["XS", "S", "M", "L", "XL", "XXL"];
const sweatPrice = 15.70;

// Convert number to euro format
let euroFormat = Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
});

const ProductCard = ({ name, price, onAdd }) => {

    const [show, setShow] = useState(false);

    const [quantity, setQuantity] = useState(1);

    const handleShow = () => setShow(true);
    const handleClose = () => setShow(false);

    const imagePath = name.replace(/\s+/g, '').concat(".png");

    //TODO: Fix image size!
    return (
        <Card style={{ width: '20rem', margin: "1em" }} onClick={handleShow}>
            <Carousel slide={false} style={{ width: '' , height: ''}}>
                <Carousel.Item>
                    <img
                        className="d-block w-100"
                        src={images[imagePath]}
                        alt="First slide"
                    />
                </Carousel.Item>
                <Carousel.Item>
                    <img
                        className="d-block w-100"
                        src={images[imagePath]}
                        alt="Second slide"
                    />
                </Carousel.Item>
            </Carousel>
            <Card.Body>
                <Card.Title>
                    <Row>
                        <Col md={8} style={{ textAlign: "left" }}>{name}</Col>
                        <Col md={4} style={{ textAlign: "right" }}>{euroFormat.format(price)}</Col>
                    </Row>
                </Card.Title>
                <Row style={{ padding: "0.5em" }}>
                    <Col>
                        <FormSelect aria-label="Tamanho">
                            {sweatSizes.map((size) => <option key={size} value={size}>{size}</option>)}
                        </FormSelect>
                    </Col>
                    <Col>
                        <Row>
                            <Col xs={3} style={{ padding: "0" }}>
                                <Button
                                    style={{ align: "center", borderRadius: "0" }}
                                    onClick={() => {
                                        if (quantity > 1)
                                            setQuantity(quantity - 1);
                                    }}
                                > 
                                    <i className="bi bi-dash"></i> 
                                </Button>
                            </Col>
                            <Col style={{ padding: "0" }}>
                                <input 
                                    style={{ textAlign: "center", borderRadius: "0" }}
                                    className="form-control" 
                                    type="text" 
                                    onChange={
                                        (event) => {
                                            if (Number(event.target.value) >= 0)
                                                setQuantity(Number(event.target.value));
                                        }
                                    } 
                                    value={quantity}
                                />
                            </Col>
                            <Col xs={3} style={{ padding: "0" }}>
                                <Button
                                    style={{ align: "center", borderRadius: "0" }}
                                    onClick={() => setQuantity(quantity + 1)}
                                > 
                                    <i className="bi bi-plus"></i> 
                                </Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Card.Footer>
                    <div className="d-grid">
                        <Button 
                            variant="success"
                            onClick={() => onAdd(name, price, quantity)}
                        >
                            <i className="bi bi-cart-plus"></i>
                        </Button>
                    </div>
                </Card.Footer>
            </Card.Body>
        </Card>                      
    );
}


// Probably should separate in multiple components
// Also, add functionallity to remove items from cart
const ShopPage = () => {

    const [productsCart, setProductsCart] = useState([]);

    // Save cart to session storage and prevent refresh from deleting cart
    useEffect(() => {
        setProductsCart(JSON.parse(window.sessionStorage.getItem("productsCart")) || []);
    }, []);

    useEffect(() => {
        window.sessionStorage.setItem("productsCart", JSON.stringify(productsCart));
    }, [productsCart]);

    const totalPrice = (cart) => {
        let total = 0;
        cart.forEach((product) => {
            total += product.price * product.quantity;
        });
        return total;
    }

    return (
        <div style={{ margin: '2rem 10vw 1rem 10vw' }}>
            <h2 style={{ textAlign: 'center' }}>Sweats EIC</h2>
            <Row>
                <Col md={10}>
                    <Row>
                    {sweatColors.map((sweatColor) => (
                        <Col key={sweatColor}>
                            <ProductCard
                                name={sweatColor}
                                price={sweatPrice}
                                onAdd={(name, price, quantity) => {
                                    setProductsCart([...productsCart, {name: name, price: price, quantity: quantity,}]);
                                }}
                            />
                        </Col>
                    ))} 
                    </Row>  
                </Col>
                <Col md={2}>
                    <div>
                        <h1><i className="bi bi-cart"></i> Cart</h1>
                        {productsCart.map((product, idx) => (
                            <div key={idx}>
                                <p>{product.name}</p>
                                <p>{product.quantity}</p>
                                <p>{product.price}</p>
                            </div>
                        ))}
                        <p>Total: {euroFormat.format(totalPrice(productsCart))}</p>
                    </div>
                </Col> 
            </Row>
        </div>
    );
 
}

export default ShopPage;