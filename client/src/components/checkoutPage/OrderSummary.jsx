import React, { useState, useEffect } from "react";
import { Container, Button } from "react-bootstrap";

export default function OrderSummary({ onSubmit, isSubmitting }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
    setItems(cartItems);
    const calculatedTotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    setTotal(calculatedTotal);
  }, []);

  return (
    <Container className="p-4 bg-white rounded shadow-sm">
      <h2 className="mb-4">Resumo do pedido</h2>

      <div className="mb-4">
        {items.map((item, index) => (
          <div
            key={`${item.id}-${item.size}-${index}`}
            className="d-flex justify-content-between align-items-start mb-3"
          >
            <div>
              <div className="d-flex align-items-center">
                <span className="me-2">{item.quantity}x</span>
                <div>
                  <div>{item.title}</div>
                  <small className="text-muted">
                    {item.color && (
                      <>
                        COR: {item.color}
                        <br />
                      </>
                    )}
                    TAMANHO: {item.size}
                  </small>
                </div>
              </div>
            </div>
            <div className="fw-bold">
              {(item.price * item.quantity).toFixed(2)} €
            </div>
          </div>
        ))}
      </div>

      <div className="border-top pt-3 mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <span className="fw-bold">TOTAL</span>
          <span className="fw-bold fs-4">{total.toFixed(2)} €</span>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-100"
        onClick={onSubmit}
        disabled={isSubmitting || items.length === 0}
      >
        {isSubmitting ? "CARREGANDO..." : "CONFIRMAR PEDIDO"}
      </Button>
    </Container>
  );
}
