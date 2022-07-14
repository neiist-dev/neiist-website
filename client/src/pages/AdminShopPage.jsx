import React from 'react';

const AdminShopPage = () => (
    <>
        <CreateProductButton />
        <ViewProducts />
    </>
);


const ViewProducts = () => {
    const [products, setProducts] = useState(null);
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        fetch('/api/products')
            .then((res) => res.json())
            .then(
                (res) => {
                    setProducts(res);
                    setIsLoaded(true);
                },
                (err) => {
                    setIsLoaded(true);
                    setError(err);
                },
            );
    }, []);

    if (!isLoaded) return <div>...</div>;
    if (error) {
        return (
            <div>
                Erro:
                {error.message}
            </div>
        );
    }
    if (products) {
        return (
            <div style={{ margin: '2rem 20vw 1rem 20vw' }}>
                <h1 style={{ textAlign: 'center', margin: 0 }}>
                    {products.length}
                    {' '}
                    Produtos Atuais
                </h1>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignContent: 'space-around',
                        flexWrap: 'wrap',
                        padding: '0 10px 10px 10px',
                    }}
                >
                    <ShopCards products={products} />
                </div>
            </div>
        );
    }
    return <div>Não foi possível carregar os produtos.</div>;
};

const ProductCard = ({ product }) => {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <>
            <Card
                style={{ margin: '10px', width: '15rem', textAlign: 'center' }}
                onClick={handleShow}
            >
                <Card.Body>
                    <Card.Title>{product.name}</Card.Title>
                </Card.Body>
            </Card>
            <ProductModal
                product={product}
                show={show}
                handleClose={handleClose}
            />
        </>
    );
};

const ProductModal = ({ product, show, handleClose }) => (
    <Modal size="lg" show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
            <Modal.Title>{product.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <h4>ID</h4>
            <p>{product.id}</p>
            <h4>Nome</h4>
            <p>{product.name}</p>
            <h4>Data de Início</h4>
            <p>{product.startDate}</p>
            <h4>Data de Fim</h4>
            <p>{product.endDate}</p>
            <h4>Resultados</h4>
            {product.options.map((option) => (
                <p key={option.id}>
                    {option.name}
                    :
                    {option.votes}
                </p>
            ))}
        </Modal.Body>
    </Modal>
);

const CreateProductButton = () => {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <div style={{ margin: '1rem 20vw 2rem 20vw', textAlign: 'center' }}>
            <Button onClick={handleShow}>Criar Produto</Button>
            <CreateProductModal show={show} handleClose={handleClose} />
        </div>
    );
};

const CreateProductModal = ({ show, handleClose }) => {
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [options, setOptions] = useState('');

    const handleNewProduct = async () => {
        const newProduct = {
            name,
            startDate,
            endDate,
            options: options.split(','),
        };
        await axios.post('/api/products', newProduct);
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Criar Eleição</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label>Nome</Form.Label>
                        <Form.Control
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Data de Início</Form.Label>
                        <Form.Control
                            type="date"
                            value={startDate}
                            onChange={(event) => setStartDate(event.target.value)}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Data de Fim</Form.Label>
                        <Form.Control
                            type="date"
                            value={endDate}
                            onChange={(event) => setEndDate(event.target.value)}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Opções separadas por vírgulas</Form.Label>
                        <Form.Control
                            type="text"
                            value={options}
                            onChange={(event) => setOptions(event.target.value)}
                        />
                    </Form.Group>
                    <Button
                        variant="primary"
                        onClick={() => {
                            handleNewProduct();
                            handleClose();
                        }}
                    >
                        Criar Produto
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AdminShopPage;