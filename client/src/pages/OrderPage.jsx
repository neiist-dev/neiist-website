import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import { fetchOrderDetailsById } from "../Api.service";

const OrderPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const order = await fetchOrderDetailsById(orderId);
        setOrder(order);
      } catch (error) {
        console.error("Erro ao buscar pedido:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!order) {
    return <div>Pedido não encontrado</div>;
  }

  return (
    <Container fluid className="py-4">
      <Container>
        <div className="text-center mb-5">
          <h1 className="mb-3">Detalhes do Pedido</h1>
          <p className="text-muted mb-0">
            Pedido #{order.order_id} •{" "}
            {new Date(order.timestamps.created_at).toLocaleDateString("pt-PT")}
          </p>
        </div>

        <Row className="g-4 mb-4">
          <Col md={6}>
            <div className="bg-white p-4 h-100 border rounded">
              <h5 className="border-bottom pb-2 mb-3">
                Informações do Cliente
              </h5>
              <div className="text-secondary">
                <div className="mb-2">
                  <strong>Nome:</strong> {order.name}
                </div>
                <div className="mb-2">
                  <strong>IST ID:</strong> {order.ist_id}
                </div>
                <div className="mb-2">
                  <strong>Email:</strong> {order.email}
                </div>
                <div className="mb-2">
                  <strong>Telefone:</strong> {order.phone}
                </div>
                <div className="mb-2">
                  <strong>Campus:</strong> {order.campus}
                </div>
                {order.nif && (
                  <div className="mb-2">
                    <strong>NIF:</strong> {order.nif}
                  </div>
                )}
              </div>
            </div>
          </Col>

          <Col md={6}>
            <div className="bg-white p-4 h-100 border rounded">
              <h5 className="border-bottom pb-2 mb-3">Status do Pedido</h5>

              <div className="mb-3">
                <h6 className="mb-1">Pagamento</h6>
                <div
                  className={
                    order.payment_info.paid ? "text-success" : "text-danger"
                  }
                >
                  <span className="me-1">
                    {order.payment_info.paid ? "✓" : "✗"}
                  </span>
                  {order.payment_info.paid ? "Pago" : "Aguardando Pagamento"}
                </div>
                {order.payment_info.paid && (
                  <div className="mt-1 text-secondary small">
                    {/* <div>
                      Responsável: {order.payment_info.payment_responsible}
                    </div> */}
                    <div>
                      Data:{" "}
                      {new Date(
                        order.payment_info.payment_timestamp
                      ).toLocaleString("pt-PT")}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h6 className="mb-1">Entrega</h6>
                <div
                  className={
                    order.delivery_info.delivered
                      ? "text-success"
                      : "text-danger"
                  }
                >
                  <span className="me-2">
                    {order.delivery_info.delivered ? "✓" : "✗"}
                  </span>
                  {order.delivery_info.delivered
                    ? "Entregue"
                    : "Aguardando Entrega"}
                </div>
                {order.delivery_info.delivered && (
                  <div className="mt-1 text-secondary small">
                    {/* <div>
                      Responsável: {order.delivery_info.delivery_responsible}
                    </div> */}
                    <div>
                      Data:{" "}
                      {new Date(
                        order.delivery_info.delivery_timestamp
                      ).toLocaleString("pt-PT")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>

        <div className="bg-white p-4 border rounded mb-4">
          <h5 className="border-bottom pb-2 mb-3">Itens do Pedido</h5>
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>ID do Produto</th>
                <th>Tamanho</th>
                <th className="text-center">Quantidade</th>
                <th className="text-end">Preço Unit.</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.product_id}</td>
                  <td>{item.size}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-end">
                    €{Number(item.unit_price).toFixed(2)}
                  </td>
                  <td className="text-end">
                    €{(Number(item.unit_price) * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <Row className="g-4">
          {order.notes && (
            <Col md={order.notes ? 8 : 12}>
              <div className="bg-white p-4 border rounded h-100">
                <h5 className="border-bottom pb-2 mb-3">Notas</h5>
                <p className="text-secondary mb-0">{order.notes}</p>
              </div>
            </Col>
          )}

          <Col md={order.notes ? 4 : 12}>
            <div className="bg-white p-4 border rounded">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Total</h5>
                <h4 className="mb-0">
                  €{Number(order.total_amount).toFixed(2)}
                </h4>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default OrderPage;
