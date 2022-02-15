import React, { useState, useEffect } from 'react';

import Card from 'react-bootstrap/Card';


/*
DB Table ideas

Product
    id
    name
    pathLink
    pathImage
    price
    stock : [[name, stockName], [], [], [], ] Isto é mau?

SimpleStock
    id
    stock

SweatStock
    id
    sizeAndName 
    size [1,2,3,4]
    name [xs,s,m,l]
*/

const ShopCard = ({name, image, link}) => (
    <Card style={{ width: '20rem'}}>
        <Card.Img variant="top" src={image} />
        <Card.Body>
            <Card.Title>{name}</Card.Title>
            <Card.Link href="{{path}}"></Card.Link>
        </Card.Body>
    </Card>
)

const ShopPage = () => {
    
    const [products, setProducts] = useState(null);
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        fetch('/api/products') //TODO
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
        /* TODO - products.map giving error
        return (
            <div style={{ margin: '2rem 20vw 1rem 20vw' }}>
                <h2 style={{ textAlign: 'center' }}>Sweats EIC</h2>
                {products.map((product) => (
                    <ShopCard name={product.name} image={product.image} path={product.path} />
                ))}
            </div>
        );
        */
        return (
            <div style={{ margin: '2rem 20vw 1rem 20vw' }}>
                <h2 style={{ textAlign: 'center' }}>Sweats EIC</h2>
            </div>
        );
    }
}

export default ShopPage