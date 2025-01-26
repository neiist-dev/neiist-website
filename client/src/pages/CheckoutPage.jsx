import { Container, Row, Col } from "react-bootstrap";
import OrderDetails from "../components/checkoutPage/OrderDetails";
import OrderSummary from "../components/checkoutPage/OrderSummary";
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { checkProductAvailability, createOrder } from "../Api.service";

import UserDataContext from "../UserDataContext";

export default function CheckoutPage() {
  const { userData } = useContext(UserDataContext);
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    istId: "",
    campus: "",
    phone: "",
    nif: "",
    notes: "",
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name,
        email: userData.email,
        istId: userData.username,
        campus: userData.courses.includes("-A") ? "alameda" : "taguspark",
        phone: "",
        nif: "",
        notes: "",
      });
    }
  }, [userData]); // Only run when userData changes

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("cart") || "[]");
    if (items.length === 0) {
      navigate("/");
      return;
    }
    setCartItems(items);
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.istId.trim()) {
      newErrors.istId = "IST ID é obrigatório";
    }

    if (!formData.campus) {
      newErrors.campus = "Campus é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkAvailability = async (items) => {
    try {
      const availabilityChecks = items.map(async (item) => {
        const data = await checkProductAvailability(item.id, item.size);
        return {
          productId: item.id,
          available: data.available,
        };
      });

      const results = await Promise.all(availabilityChecks);
      const unavailableItems = results.filter((item) => !item.available);

      if (unavailableItems.length > 0) {
        throw new Error("Alguns itens não estão mais disponíveis");
      }

      return true;
    } catch (error) {
      throw new Error("Erro ao verificar disponibilidade dos produtos");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // First check availability of all items
      await checkAvailability(cartItems);

      // Prepare order data according to API requirements
      const orderData = {
        items: cartItems.map((item) => ({
          product_id: item.id,
          size: item.size,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        name: formData.name,
        email: formData.email,
        ist_id: formData.istId,
        campus: formData.campus,
        phone: formData.phone || undefined,
        nif: formData.nif || undefined,
        notes: formData.notes || undefined,
      };

      const data = await createOrder(orderData);

      if (data.orderId) {
        localStorage.removeItem("cart");
        navigate(`/order/${data.orderId}`);
      } else {
        throw new Error("Pedido criado mas sem ID retornado");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      setErrors((prev) => ({
        ...prev,
        submit:
          error.message || "Erro ao enviar pedido. Por favor, tente novamente.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container fluid className="bg-light min-vh-100 py-4">
      <Container>
        <Row className="g-4">
          <Col lg={7}>
            <OrderDetails
              formData={formData}
              setFormData={setFormData}
              errors={errors}
            />
          </Col>
          <Col lg={5}>
            <OrderSummary onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </Col>
        </Row>
      </Container>
    </Container>
  );
}
