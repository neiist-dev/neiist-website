import React, { useState } from "react";
import { Card, Modal } from "react-bootstrap";
import styles from "./ProductCard.module.css";
import NotificationCard from "./Notification";

const ProductCard = ({
  id,
  title,
  color,
  colorHex,
  price,
  images,
  defaultSize,
  stockType,
  orderInfo,
  variants,
  description,
  details,
}) => {
  const [quantity, setQuantity] = useState(orderInfo?.minOrderQuantity || 1);
  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const [currentImage, setCurrentImage] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const productImages = images?.length > 0 ? images : [];
  const productVariants = variants?.length > 0 ? variants : [];

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % productImages.length);
  };

  const previousImage = () => {
    setCurrentImage(
      (prev) => (prev - 1 + productImages.length) % productImages.length
    );
  };

  const handleAddToCart = () => {
    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");

    const existingItemIndex = currentCart.findIndex(
      (item) => item.id === id && item.size === selectedSize
    );

    const newItem = {
      id,
      title,
      color: color?.name,
      colorHex: color?.hex,
      size: selectedSize,
      quantity,
      price,
      image: productImages[0],
      stockType,
      orderInfo: {
        estimatedDelivery: orderInfo?.estimatedDelivery,
        minOrderQuantity: orderInfo?.minOrderQuantity,
      },
    };

    if (existingItemIndex !== -1) {
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      currentCart.push(newItem);
    }

    localStorage.setItem("cart", JSON.stringify(currentCart));
    setShowNotification(true);
  };

  const renderTitle = () => {
    if (color?.name && color?.hex) {
      return (
        <>
          {title} – <span style={{ color: color.hex }}>{color.name}</span>
        </>
      );
    }
    return title;
  };

  const handleQuantityChange = (newQuantity) => {
    const minQuantity = orderInfo?.minOrderQuantity || 1;
    if (newQuantity >= minQuantity) {
      setQuantity(newQuantity);
    }
  };

  return (
    <>
      <Card className={styles["product-card"]}>
        <div className={styles["product-content"]}>
          <div className={styles["product-image-container"]}>
            {productImages.length > 0 && (
              <>
                <img
                  src={productImages[currentImage]}
                  alt={color?.name ? `${title} - ${color.name}` : title}
                  className={styles["product-image"]}
                />
                {productImages.length > 1 && (
                  <>
                    <button
                      className={`${styles["carousel-button"]} ${styles.left}`}
                      onClick={previousImage}
                    >
                      ‹
                    </button>
                    <button
                      className={`${styles["carousel-button"]} ${styles.right}`}
                      onClick={nextImage}
                    >
                      ›
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          <div className={styles["product-details"]}>
            <div className={styles["product-header"]}>
              <h2 className={styles["product-title"]}>{renderTitle()}</h2>
              <div className={styles["price-info"]}>
                <span className={styles["product-price"]}>
                  {price.toFixed(2)} €
                </span>
              </div>
            </div>

            {productVariants.length > 0 && (
              <div className={styles["size-section"]}>
                <p className={styles["size-label"]}>TAMANHO: {selectedSize}</p>
                <div className={styles["size-buttons"]}>
                  {productVariants.map((variant) => (
                    <button
                      key={variant.size}
                      className={`${styles["size-button"]} 
                        ${selectedSize === variant.size ? styles.active : ""}
                        ${!variant.available ? styles.disabled : ""}`}
                      onClick={() =>
                        variant.available && setSelectedSize(variant.size)
                      }
                      disabled={!variant.available}
                    >
                      {variant.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles["purchase-controls"]}>
              <div className={styles["quantity-control"]}>
                <button
                  className={styles["quantity-button"]}
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= (orderInfo?.minOrderQuantity || 1)}
                >
                  −
                </button>
                <span className={styles["quantity-display"]}>
                  {quantity.toString().padStart(2, "0")}
                </span>
                <button
                  className={styles["quantity-button"]}
                  onClick={() => handleQuantityChange(quantity + 1)}
                >
                  +
                </button>
              </div>
              <button
                className={styles["add-button"]}
                onClick={handleAddToCart}
              >
                🛒 ADICIONAR
              </button>
            </div>

            <button
              className={styles["details-button"]}
              onClick={() => setShowDetails(true)}
            >
              Ver detalhes do produto
            </button>
          </div>
        </div>
      </Card>

      {showNotification && (
        <NotificationCard
          message="Produto adicionado ao carrinho!"
          onClose={() => setShowNotification(false)}
        />
      )}

      <Modal show={showDetails} onHide={() => setShowDetails(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {description && (
            <>
              <h5>Descrição</h5>
              <p>{description}</p>
            </>
          )}
          {details && (
            <>
              <h5>Detalhes</h5>
              {Object.entries(details).map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {value}
                </p>
              ))}
            </>
          )}
          {stockType === "onDemand" && orderInfo && (
            <>
              <h5>Informações de Encomenda</h5>
              {orderInfo.estimatedDelivery && (
                <p>Entrega prevista: {orderInfo.estimatedDelivery}</p>
              )}
              {orderInfo.orderDeadline && (
                <p>
                  Data limite para encomendas:{" "}
                  {new Date(orderInfo.orderDeadline).toLocaleDateString(
                    "pt-PT"
                  )}
                </p>
              )}
              {orderInfo.minOrderQuantity > 1 && (
                <p>Quantidade mínima: {orderInfo.minOrderQuantity}</p>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ProductCard;
