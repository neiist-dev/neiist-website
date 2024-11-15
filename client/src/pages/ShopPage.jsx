import React, { useState } from "react";
import { FaRegBell } from "react-icons/fa";
import { Card, Button, Container, Row, Col, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const ProductPage = () => {
  return (
    <Container className="py-4">
      {/* Banner de Aviso */}
      <Alert
        variant="primary"
        className="d-flex align-items-center mb-4 py-3"
        style={{
          backgroundColor: '#0d6efd',
          border: 'none',
          borderRadius: '0.5rem',
          color: 'white'
        }}
      >
        <span className="me-2"><FaRegBell size={20} /></span>
        A venda das sweats EIC decorre entre XX e XX de dezembro...
      </Alert>

      {/* Cards dos Produtos */}
      <div className="d-flex flex-column gap-4">
        <ProductCard
          title="SWEATS EIC 24/25"
          color="AZUL PETRÓLEO"
          price={20.00}
          defaultSize="XS"
        />
        <ProductCard
          title="SWEATS EIC 24/25"
          color="BORDEAUX"
          price={20.00}
          defaultSize="M"
        />
      </div>
    </Container>
  );
};

const ProductCard = ({
  title = "SWEATS EIC 24/25",
  color = "AZUL PETRÓLEO",
  price = 20.00,
  image = "/placeholder.svg?height=200&width=200",
  defaultSize = "XS"
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  return (
    <Card className="w-100 mx-auto" style={{ maxWidth: '42rem' }}>
      <Card.Body className="p-4">
        <Row className="g-4">
          <Col md={4}>
            <img
              src={image}
              alt={`${title} - ${color}`}
              className="img-fluid rounded"
            />
          </Col>
          <Col md={8}>
            <div className="d-flex flex-column gap-4">
              <div>
                <h2 className="fs-4 fw-semibold d-flex align-items-center gap-2">
                  {title}
                  <span className="text-muted">–</span>
                  <span className={color === "BORDEAUX" ? "text-danger" : "text-primary"}>
                    {color}
                  </span>
                </h2>
                <p className="text-muted small mb-2">TAMANHO: {selectedSize}</p>
              </div>

              <div>
                <div className="d-flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "primary" : "outline-primary"}
                      className="d-flex align-items-center justify-content-center"
                      style={{ width: '3rem', height: '3rem' }}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center border rounded">
                  <Button
                    variant="light"
                    className="px-3 border-end"
                    style={{ height: '3rem' }}
                    onClick={decreaseQuantity}
                  >
                    −
                  </Button>
                  <div
                    className="px-3 d-flex align-items-center justify-content-center"
                    style={{ width: '3rem', height: '3rem' }}
                  >
                    {quantity.toString().padStart(2, '0')}
                  </div>
                  <Button
                    variant="light"
                    className="px-3 border-start"
                    style={{ height: '3rem' }}
                    onClick={increaseQuantity}
                  >
                    +
                  </Button>
                </div>
                <div className="flex-grow-1 text-end">
                  <p className="fs-3 fw-bold mb-0">{price.toFixed(2)} €</p>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-100 d-flex align-items-center justify-content-center gap-2"
                style={{ height: '3rem' }}
              >
                🛒 ADICIONAR
              </Button>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default ProductPage;