import React, { useState } from "react";
import { Card } from "react-bootstrap";
import styles from '../css/ShopCard.module.css';

const ProductCard = ({
    title = "SWEATS EIC 24/25",
    color = "AZUL PETRÓLEO",
    colorHex = "#0d6efd",
    price = 20.00,
    images = [],
    defaultSize = "XS"
}) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState(defaultSize);
    const [currentImage, setCurrentImage] = useState(0);
    const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

    const nextImage = () => {
        setCurrentImage((prev) => (prev + 1) % images.length);
    };

    const previousImage = () => {
        setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <Card className={styles['product-card']}>
            <div className={styles['product-content']}>
                <div className={styles['product-image-container']}>
                    {images.length > 0 && (
                        <>
                            <img
                                src={`/sweats/${images[currentImage]}`}
                                alt={`${title} - ${color}`}
                                className={styles['product-image']}
                            />
                            {images.length > 1 && (
                                <>
                                    <button
                                        className={`${styles['carousel-button']} ${styles.left}`}
                                        onClick={previousImage}
                                    >
                                        ‹
                                    </button>
                                    <button
                                        className={`${styles['carousel-button']} ${styles.right}`}
                                        onClick={nextImage}
                                    >
                                        ›
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className={styles['product-details']}>
                    <div className={styles['product-header']}>
                        <h2 className={styles['product-title']}>
                            {title} – <span style={{ color: colorHex }}>{color}</span>
                        </h2>
                        <span className={styles['product-price']}>{price.toFixed(2)} €</span>
                    </div>

                    <div className={styles['size-section']}>
                        <p className={styles['size-label']}>TAMANHO: {selectedSize}</p>
                        <div className={styles['size-buttons']}>
                            {sizes.map((size) => (
                                <button
                                    key={size}
                                    className={`${styles['size-button']} ${selectedSize === size ? styles.active : ''
                                        }`}
                                    onClick={() => setSelectedSize(size)}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles['purchase-controls']}>
                        <div className={styles['quantity-control']}>
                            <button
                                className={styles['quantity-button']}
                                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                            >
                                −
                            </button>
                            <span className={styles['quantity-display']}>
                                {quantity.toString().padStart(2, '0')}
                            </span>
                            <button
                                className={styles['quantity-button']}
                                onClick={() => setQuantity(quantity + 1)}
                            >
                                +
                            </button>
                        </div>
                        <button className={styles['add-button']}>
                            🛒 ADICIONAR
                        </button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ProductCard;