import React, { useEffect, useState } from "react";
import { Toast } from "react-bootstrap";
import { FaCheckCircle } from "react-icons/fa";

const NotificationCard = ({
  message = "Produto adicionado ao carrinho!",
  duration = 3000,
  onClose,
}) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setShow(false);
    if (onClose) onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        zIndex: 1050,
        minWidth: "280px",
      }}
    >
      <Toast show={show} onClose={handleClose} animation={true}>
        <Toast.Header>
          <FaCheckCircle className="me-2 text-success" />
          <strong className="me-auto">Notificação</strong>
        </Toast.Header>
        <Toast.Body>{message}</Toast.Body>
      </Toast>
    </div>
  );
};

export default NotificationCard;
