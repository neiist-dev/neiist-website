import { Container, Button } from 'react-bootstrap';

function OrderSummary({ onSubmit, isSubmitting }) {
    return (
        <Container className="p-4 bg-white rounded shadow-sm">
            <h2 className="mb-4">Resumo do pedido</h2>

            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <div className="d-flex align-items-center">
                            <span className="me-2">1x</span>
                            <div>
                                <div>Sweat EIC 24/25</div>
                                <small className="text-muted">
                                    COR: AZUL PETRÓLEO<br />
                                    TAMANHO: XS
                                </small>
                            </div>
                        </div>
                    </div>
                    <div className="fw-bold">20,00 €</div>
                </div>

                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <div className="d-flex align-items-center">
                            <span className="me-2">2x</span>
                            <div>
                                <div>Sweat EIC 24/25</div>
                                <small className="text-muted">
                                    COR: BORDEAUX<br />
                                    TAMANHO: M
                                </small>
                            </div>
                        </div>
                    </div>
                    <div className="fw-bold">40,00 €</div>
                </div>
            </div>

            <div className="border-top pt-3 mb-4">
                <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">TOTAL</span>
                    <span className="fw-bold fs-4">60,00 €</span>
                </div>
            </div>

            <Button
                variant="primary"
                size="lg"
                className="w-100"
                onClick={onSubmit}
                disabled={isSubmitting}
            >
                {isSubmitting ? 'PROCESSANDO...' : 'CONFIRMAR PEDIDO'}
            </Button>
        </Container>
    );
}

export default OrderSummary;