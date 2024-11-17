import { Container, Row, Col } from 'react-bootstrap';
import OrderDetails from '../components/checkoutPage/OrderDetails';
import OrderSummary from '../components/checkoutPage/OrderSummary';
import { useState } from 'react';

export default function CheckoutPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        istId: '',
        campus: '',
        phone: '',
        nif: '',
        notes: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email é obrigatório';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!formData.istId.trim()) {
            newErrors.istId = 'IST ID é obrigatório';
        }

        if (!formData.campus) {
            newErrors.campus = 'Campus é obrigatório';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/submit-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Erro ao enviar pedido');
            }

            alert('Pedido enviado com sucesso!');
            // window.location.href = '/confirmation';

        } catch (error) {
            alert('Erro ao enviar pedido. Por favor, tente novamente.');
            console.error('Erro:', error);
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
                        <OrderSummary
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                        />
                    </Col>
                </Row>
            </Container>
        </Container>
    );
}