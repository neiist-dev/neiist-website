import {
  Form,
  Container,
  OverlayTrigger,
  Button,
  Tooltip,
} from "react-bootstrap";

function OrderDetails({ formData, setFormData, errors }) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const campusTooltip = (
    <Tooltip id="campus-tooltip">
      O campus que for identificado abaixo será o local de levantamento da
      encomenda
    </Tooltip>
  );

  const fenixLoginUrl =
    "https://fenix.tecnico.ulisboa.pt/oauth/userdialog" +
    `?client_id=${process.env.REACT_APP_FENIX_CLIENT_ID}` +
    `&redirect_uri=${process.env.REACT_APP_FENIX_REDIRECT_URI}`;

  return (
    <Container className="p-4 bg-white rounded shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Detalhes</h2>
        {(!formData.name ||
          !formData.email ||
          !formData.istId ||
          !formData.campus) && (
          <Button
            href={fenixLoginUrl}
            variant="outline-primary"
            size="sm"
            className="d-flex align-items-center gap-2"
          >
            Preencher dados automaticamente
          </Button>
        )}
      </div>

      <Form>
        <Form.Group className="mb-3">
          <Form.Label>
            Nome <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="John Doe"
            isInvalid={!!errors.name}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.name}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>
            Email <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="john.doe@gmail.com"
            isInvalid={!!errors.email}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.email}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>
            IST ID <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            type="text"
            name="istId"
            value={formData.istId}
            onChange={handleInputChange}
            placeholder="ist1XXXXX"
            isInvalid={!!errors.istId}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.istId}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>
            Campus <span className="text-danger">*</span>
            <OverlayTrigger placement="right" overlay={campusTooltip}>
              <span className="d-inline-block">
                <Button variant="link" className="p-0 m-0 text-info">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </Button>
              </span>
            </OverlayTrigger>
          </Form.Label>
          <Form.Select
            name="campus"
            value={formData.campus}
            onChange={handleInputChange}
            isInvalid={!!errors.campus}
            required
          >
            <option value="">Alameda / Taguspark</option>
            <option value="alameda">Alameda</option>
            <option value="taguspark">Taguspark</option>
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            {errors.campus}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Número telemóvel</Form.Label>
          <Form.Control
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+351 9xx xxx xxx"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>NIF</Form.Label>
          <Form.Control
            type="text"
            name="nif"
            value={formData.nif}
            onChange={handleInputChange}
            placeholder="XXXXXXXXXXX"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Notas</Form.Label>
          <Form.Control
            as="textarea"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            placeholder="Pode escrever aqui tudo o que aches que seja relevante ao pedido..."
          />
        </Form.Group>

        <div className="mt-4">
          <h5>Informações Importantes</h5>
          <small className="text-muted">
            <p>
              1. O NEIST disponibiliza na sua loja todos os tamanhos disponíveis
              para encomenda, não sendo responsável por tamanhos indisponíveis e
              não garantindo a troca por um tamanho diferente após (término
              requisição).
            </p>
            <p>
              2. O NEIST guardará os itens adquiridos online por um período
              máximo de 4 meses após o período máximo de chegada dos mesmos.
              Após este período, o NEIST está propriedade dos itens e/ou
              dinheiro dos itens não-levantados, não garantindo a entrega dos
              mesmos nem o seu reembolso.
            </p>
          </small>
        </div>
      </Form>
    </Container>
  );
}

export default OrderDetails;
