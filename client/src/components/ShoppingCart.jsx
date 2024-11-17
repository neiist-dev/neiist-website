import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { FaTimes, FaPlus, FaMinus } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import style from './css/ShoppingCart.module.css';

export default function ShoppingCart({ show, onHide }) {
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState(show);
    const [items, setItems] = useState([
        {
            id: 1,
            name: 'Sweat EIC 24/25',
            color: 'AZUL PETRÓLEO',
            size: 'XS',
            price: 20.00,
            quantity: 1,
            image: 'Blue.JPG'
        },
        {
            id: 2,
            name: 'Sweat EIC 24/25',
            color: 'BORDEAUX',
            size: 'M',
            price: 40.00,
            quantity: 1,
            image: 'Blue.JPG'
        }
    ]);

    useEffect(() => {
        if (show) {
            setIsClosing(false);
            setShouldRender(true);
        } else if (!isClosing) {
            setShouldRender(false);
        }
    }, [show]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onHide();
            setIsClosing(false);
        }, 30);
    };

    const handleQuantityChange = (id, change) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const newQuantity = Math.max(1, item.quantity + change);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (!shouldRender && !isClosing) return null;

    return (
        <Modal
            show={show || isClosing}
            onHide={handleClose}
            className={style.modalRight}
            dialogClassName={`${style.modalRightDialog} ${isClosing ? style.closing : ''}`}
            backdrop={true}
            keyboard={false}
        >
            <Modal.Header className={style.header}>
                <Modal.Title className={style.headerTitle}>Carrinho de Compras</Modal.Title>
                <button className={style.closeButton} onClick={handleClose}>
                    <FaTimes size={18} />
                </button>
            </Modal.Header>
            <hr />
            <Modal.Body>
                {items.map(item => (
                    <React.Fragment key={item.id}>
                        <div className={style.itemContainer}>
                            <img
                                src={`/sweats/${item.image}`}
                                alt={item.name}
                                className={style.itemImage}
                            />
                            <div className={style.itemInfo}>
                                <h6 className={style.itemName}>{item.name}</h6>
                                <small className={style.itemMeta}>COR: {item.color}</small>
                                <small className={style.itemMeta}>TAMANHO: {item.size}</small>
                                <div className={style.quantityControls}>
                                    <button
                                        className={style.quantityButton}
                                        onClick={() => handleQuantityChange(item.id, -1)}
                                    >
                                        <FaMinus size={14} />
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button
                                        className={style.quantityButton}
                                        onClick={() => handleQuantityChange(item.id, 1)}
                                    >
                                        <FaPlus size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className={style.itemPrice}>
                                <strong>{item.price.toFixed(2)} €</strong>
                            </div>
                        </div>
                        <hr />
                    </React.Fragment>
                ))}
            </Modal.Body>
            <div className={style.footer}>
                <hr />
                <div className={style.total}>
                    <strong>TOTAL</strong>
                    <strong>{total.toFixed(2)} €</strong>
                </div>
                <Link
                    to="/checkout"
                    className={style.checkoutButton}
                    onClick={handleClose}
                >
                    CHECKOUT
                </Link>
            </div>
        </Modal>
    );
}