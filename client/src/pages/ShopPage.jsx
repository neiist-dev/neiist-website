import axios from 'axios';
import React, { useState, useEffect } from 'react';

import Card from 'react-bootstrap/Card';


/*
DB Table ideas

Product
    id
    name
    price
    pathImage
    idStock

Stock
    id
    xs
    s
    m
    l
    xl
    xxl

*/

// Idea: show cards and onclick show modal to view more photos and buy
const ShopCard = (product) => (
    <Card key={keyValue} style={{ width: '20rem', margin: "1em" }}>
        <Card.Img variant="top" />
        <Card.Body>
            <Card.Title>{name}</Card.Title>
        </Card.Body>
    </Card>
)

const ShopPage = () => {

    const [products, setProducts] = useState(null);
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        fetch('/api/products')
            .then((res) => res.json())
            .then(
                (productsRes) => {
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
        return (
            <div style={{ margin: '2rem 20vw 1rem 20vw' }}>
                <h2 style={{ textAlign: 'center' }}>Sweats EIC</h2>
                {products.map((product) => (
                    <ShopCard item={product} />
                ))}
            </div>
        );
    }
    return <div>Não foi possível carregar os produtos.</div>;
}

export default ShopPage;