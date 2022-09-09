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
const sweatColors = ["Sweat Azul", "Sweat Vermelha", "Sweat Beje", "Sweat Cor-de-Rosa"];
const sweatSizes = ["XS", "S", "M", "L", "XL", "XXL"];
const sweatPrice = 15.70;
let euroFormat = Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
});

const ProductCard = ({ name, price }) => {

    const [show, setShow] = useState(false);

    const [quantity, setQuantity] = useState(1);

    const handleShow = () => setShow(true);
    const handleClose = () => setShow(false);

    const imagePath = name.replace(/\s+/g, '').concat(".png");

    // meter no input
    // <input className="form-control" type="text" onChange={null} value={quantity} />

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
                        <Col md={4} style={{ textAlign: "right" }}>{price}</Col>
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
                            <Col xs={4} style={{ padding: "0" }}>
                                <Button
                                    style={{ align: "center" }}
                                    onClick={() => {
                                        if (quantity > 1)
                                            setQuantity(quantity - 1);
                                    }}
                                > <i className="bi bi-dash"></i> </Button>
                            </Col>
                            <Col xs={4}>
                                meter input aqui
                            </Col>
                            <Col xs={4} style={{ padding: "0" }}>
                                <Button
                                    style={{ align: "center" }}
                                    onClick={() => setQuantity(quantity + 1)}
                                > <i className="bi bi-plus"></i> </Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Card.Footer>
                    <div className="d-grid">
                        <Button variant="success" >Adicionar ao cesto</Button>
                    </div>
                </Card.Footer>
            </Card.Body>
        </Card>                      
    );
}

const ShopPage = () => {

    return (
        <div style={{ margin: '2rem 10vw 1rem 10vw' }}>
            <h2 style={{ textAlign: 'center' }}>Sweats EIC</h2>
            <Row>
                {sweatColors.map((sweatColor) => (
                    <Col key={sweatColor}>
                        <ProductCard
                            name={sweatColor}
                            price={euroFormat.format(sweatPrice)}
                        />
                    </Col>
                ))}    
            </Row>
        </div>
    );
 
}

export default ShopPage;