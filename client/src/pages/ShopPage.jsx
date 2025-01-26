import React, { useState, useEffect } from "react";
import { FaRegBell } from "react-icons/fa";
import { Container, Alert, Row, Col } from "react-bootstrap";
import ProductCard from "../components/shopPage/ProductCard";
import LoadSpinner from "../hooks/loadSpinner";
import { fetchProducts } from "../Api.service";

const StorePage = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeType, setActiveType] = useState("all");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();

        const visibleProducts = data.filter(
          (product) => product.visible !== false
        );

        setProducts(visibleProducts);
      } catch (err) {
        setError(err.message || "Erro ao carregar produtos");
      } finally {
        setIsLoaded(true);
      }
    };

    loadProducts();
  }, []);

  const getFilteredProducts = () => {
    if (!Array.isArray(products)) return [];
    return activeType === "all"
      ? products
      : products.filter(
          (product) => product?.type?.toLowerCase() === activeType.toLowerCase()
        );
  };

  const getOrderDeadline = () => {
    if (!Array.isArray(products) || !products.length) return null;

    const onDemandProducts = products.filter(
      (p) => p?.stockType === "onDemand" && p?.orderInfo?.orderDeadline
    );

    if (!onDemandProducts.length) return null;

    const deadlines = onDemandProducts
      .map((p) => new Date(p.orderInfo.orderDeadline))
      .filter((date) => !isNaN(date.getTime()));

    return deadlines.length ? new Date(Math.min(...deadlines)) : null;
  };

  if (!isLoaded) {
    return <LoadSpinner />;
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <h4>Erro ao carregar produtos</h4>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            Por favor, tente novamente mais tarde ou contacte o suporte se o
            problema persistir.
          </p>
        </Alert>
      </Container>
    );
  }

  const deadline = getOrderDeadline();
  const filteredProducts = getFilteredProducts();

  return (
    <Container className="py-4">
      {deadline && (
        <Alert
          variant="primary"
          className="d-flex align-items-center mb-4 py-3"
          style={{
            backgroundColor: "#0d6efd",
            border: "none",
            borderRadius: "0.5rem",
            color: "white",
          }}
        >
          <span className="me-2">
            <FaRegBell size={20} />
          </span>
          As encomendas estão disponíveis até{" "}
          {deadline.toLocaleDateString("pt-PT")}
        </Alert>
      )}

      <div className="mb-4">
        <div className="d-flex gap-2 justify-content-center">
          <button
            className={`btn ${
              activeType === "all" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setActiveType("all")}
          >
            Todos
          </button>
          <button
            className={`btn ${
              activeType === "clothing" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setActiveType("clothing")}
          >
            Sweats
          </button>
          <button
            className={`btn ${
              activeType === "stickers" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setActiveType("stickers")}
          >
            Stickers
          </button>
        </div>
      </div>

      <Row className="g-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <Col key={product.id} xs={12}>
              <ProductCard
                id={product.id}
                title={product.name}
                color={product.color?.name}
                colorHex={product.color?.hex}
                price={product.price}
                images={product.images?.map((img) => img.url) || []}
                defaultSize={product.variants?.[0]?.size}
                stockType={product.stockType}
                orderInfo={product.orderInfo}
                variants={product.variants}
                description={product.description}
                details={product.details}
              />
            </Col>
          ))
        ) : (
          <Col>
            <Alert variant="info">
              Nenhum produto disponível nesta categoria.
            </Alert>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default StorePage;
