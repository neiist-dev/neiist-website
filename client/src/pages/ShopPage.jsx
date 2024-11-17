// ProductPage.jsx
import React from "react";
import { FaRegBell } from "react-icons/fa";
import { Container, Alert } from "react-bootstrap";
import ProductCard from "../components/shopPage/ShopCard";
import "bootstrap/dist/css/bootstrap.min.css";

const ProductPage = () => {
  return (
    <Container className="py-4">
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

      <div className="d-flex flex-column gap-4">
        <ProductCard
          title="SWEATS EIC 24/25"
          color="AZUL PETRÓLEO"
          images={
            ["Blue.JPG"]
          }
          colorHex="#0d6efd"
          price={20.00}
          defaultSize="XS"
        />
        <ProductCard
          title="SWEATS EIC 24/25"
          color="BORDEAUX"
          images={
            ["Bordeaux1.JPG", "Bordeaux2.JPG"]
          }
          colorHex="#8b0000"
          price={20.00}
          defaultSize="M"
        />
      </div>
    </Container>
  );
};

export default ProductPage;