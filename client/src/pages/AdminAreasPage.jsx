import React, { useState, useEffect } from 'react';
import LoadSpinner from "../hooks/loadSpinner.jsx";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import { fetchThesisAreas } from '../Api.service.js';

import axios from 'axios';

const AdminAreasPage = () => (
  <>
    <UploadAreasButton />
    <ViewAreas />
  </>
);

const ViewAreas = () => {
  const [areas, setAreas] = useState(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchThesisAreas()
      .then(
        (res) => {
          setAreas(res);
          setIsLoaded(true);
        },
        (err) => {
          setIsLoaded(true);
          setError(err);
        },
      );
  }, []);

  if (!isLoaded) {
    return <LoadSpinner />;
  }
  if (error) {
    return (
      <div>
        Erro:
        {error.message}
      </div>
    );
  }
  if (areas) {
    return (
      <div style={{ margin: '2rem 6em 1rem 6em' }}>
        <h1 style={{ textAlign: 'center', margin: 0 }}>
          {areas.length}
          {' '}
          Áreas Disponíveis
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
          {areas.map((area) => (
            <AreaCard key={area.code} area={area} />
          ))}
        </div>
      </div>
    );
  }
  return <div>Não foi possível carregar as áreas.</div>;
};

const AreaCard = ({ area }) => {
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
          <Card.Title>{area.short}</Card.Title>
        </Card.Body>
      </Card>
      <AreaModal
        area={area}
        show={show}
        handleClose={handleClose}
      />
    </>
  );
};

const AreaModal = ({ area, show, handleClose }) => (
  <Modal size="lg" show={show} onHide={handleClose} centered>
    <Modal.Header closeButton>
      <Modal.Title>{area.short}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <h4>code</h4>
      <p>{area.code}</p>
      <h4>short</h4>
      <p>{area.short}</p>
      <h4>long</h4>
      <p>{area.long}</p>
    </Modal.Body>
  </Modal>
);

const UploadAreasButton = () => {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <div style={{ margin: '1rem 6em 2rem 6em', textAlign: 'center' }}>
      <Button onClick={handleShow}>Carregar Áreas</Button>
      <UploadAreasModal show={show} handleClose={handleClose} />
    </div>
  );
};

const UploadAreasModal = ({ show, handleClose }) => {
  const [selectedFile, setSelectedFile] = useState();
  const [isFilePicked, setIsFilePicked] = useState(false);

  const handleChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setIsFilePicked(true);
  };

  const handleUploadAreas = () => {
    const formData = new FormData();
    formData.append('areas', selectedFile);
    axios.post('/api/areas', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Carregar Áreas</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Control type="file" label="Áreas em formato json" onChange={handleChange} />
          </Form.Group>
          <Button
            variant="primary"
            onClick={() => {
              if (isFilePicked) {
                handleUploadAreas();
                handleClose();
              }
            }}
          >
            Carregar Áreas
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AdminAreasPage;
