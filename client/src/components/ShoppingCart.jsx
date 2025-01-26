import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { FaTimes, FaPlus, FaMinus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { BsCartXFill } from "react-icons/bs";

import style from "./css/ShoppingCart.module.css";

export default function ShoppingCart({ show, onHide }) {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(show);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
    setItems(cartItems);
  }, [show]);

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

  const handleQuantityChange = (id, size, change) => {
    const updatedItems = items.map((item) => {
      if (item.id === id && item.size === size) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    setItems(updatedItems);
    localStorage.setItem("cart", JSON.stringify(updatedItems));
  };

  const handleRemoveItem = (id, size) => {
    const updatedItems = items.filter(
      (item) => !(item.id === id && item.size === size)
    );
    setItems(updatedItems);
    localStorage.setItem("cart", JSON.stringify(updatedItems));
  };

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (!shouldRender && !isClosing) return null;

  return (
    <Modal
      show={show || isClosing}
      onHide={handleClose}
      className={style.modalRight}
      dialogClassName={`${style.modalRightDialog} ${
        isClosing ? style.closing : ""
      }`}
      backdrop={true}
      keyboard={false}
    >
      <Modal.Header className={style.header}>
        <Modal.Title className={style.headerTitle}>
          Carrinho de Compras
        </Modal.Title>
        <button className={style.closeButton} onClick={handleClose}>
          <FaTimes size={18} />
        </button>
      </Modal.Header>
      <hr />
      <Modal.Body className={style.modalBody}>
        {items.length === 0 ? (
          <div className={style.emptyCart}>
            <p>O seu carrinho está vazio</p>
          </div>
        ) : (
          <div className={style.itemsList}>
            {items.map((item, index) => (
              <React.Fragment key={`${item.id}-${item.size}-${index}`}>
                <div className={style.itemContainer}>
                  <div className={style.itemImageContainer}>
                    <img
                      src={item.image}
                      alt={item.title}
                      className={style.itemImage}
                    />
                  </div>
                  <div className={style.itemInfo}>
                    <h6 className={style.itemName}>{item.title}</h6>
                    {item.color && (
                      <small className={style.itemMeta}>
                        COR: {item.color}
                      </small>
                    )}
                    <small className={style.itemMeta}>
                      TAMANHO: {item.size}
                    </small>
                    <div className={style.controlsContainer}>
                      <div className={style.quantityControls}>
                        <button
                          className={style.quantityButton}
                          onClick={() =>
                            handleQuantityChange(item.id, item.size, -1)
                          }
                        >
                          <FaMinus size={16} />
                        </button>
                        <span className={style.quantityText}>
                          {item.quantity}
                        </span>
                        <button
                          className={style.quantityButton}
                          onClick={() =>
                            handleQuantityChange(item.id, item.size, 1)
                          }
                        >
                          <FaPlus size={16} />
                        </button>
                      </div>
                      <button
                        className={style.removeButton}
                        onClick={() => handleRemoveItem(item.id, item.size)}
                      >
                        <BsCartXFill size={16} />
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
          </div>
        )}
      </Modal.Body>
      <div className={style.footer}>
        <hr />
        <div className={style.total}>
          <strong>TOTAL</strong>
          <strong>{total.toFixed(2)} €</strong>
        </div>
        {items.length > 0 && (
          <Link
            to="/checkout"
            className={style.checkoutButton}
            onClick={handleClose}
          >
            CHECKOUT
          </Link>
        )}
      </div>
    </Modal>
  );
}
