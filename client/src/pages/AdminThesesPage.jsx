import React, { useState, useEffect } from 'react';
import LoadSpinner from "../hooks/loadSpinner.jsx";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import { fetchThesis, fetchThesisAreas } from '../Api.service.js';

import axios from 'axios';

const AdminThesesPage = () => (
  <>
    <UploadThesesButton />
    <ViewTheses />
  </>
);

const ViewTheses = () => {
  const [theses, setTheses] = useState(null);
  const [areas, setAreas] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchThesis(),
      fetchThesisAreas(),
    ]).then(([fetchTheses, fetchAreas]) => {
      setTheses(fetchTheses);
      setAreas(fetchAreas);
    });
  }, []);

  if (theses && areas) {
    return (
      <div style={{ margin: '2rem 6em 1rem 6em' }}>
        <h1 style={{ textAlign: 'center', margin: 0 }}>
          {theses.length}
          {' '}
          Teses Disponíveis
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
          {theses.map((thesis) => (
            <ThesisCard key={thesis.id} thesis={thesis} areas={areas} />
          ))}
        </div>
      </div>
    );
  }
  return <LoadSpinner />;
};

const ThesisCard = ({ thesis, areas }) => {
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
          <Card.Title>{thesis.title}</Card.Title>
        </Card.Body>
      </Card>
      <ThesisModal
        thesis={thesis}
        show={show}
        handleClose={handleClose}
        areas={areas}
      />
    </>
  );
};

const ThesisModal = ({
  thesis, show, handleClose, areas,
}) => (
  <Modal size="lg" show={show} onHide={handleClose} centered>
    <Modal.Header closeButton>
      <Modal.Title>{thesis.title}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <h2>ID</h2>
      <p>{thesis.id}</p>
      <h2>Objectives</h2>
      <p>{thesis.objectives}</p>
      <h2>Requirements</h2>
      <p>{thesis.requirements}</p>
      <h2>Observations</h2>
      <p>{thesis.observations}</p>
      <h2>Supervisors</h2>
      {thesis.supervisors.map((supervisor) => (
        <p key={supervisor}>{supervisor}</p>
      ))}
      <h2>Vacancies</h2>
      <p>{thesis.vacancies}</p>
      <h2>Location</h2>
      <p>{thesis.location}</p>
      <h2>Areas</h2>
      <p>{areas.find((area) => area.code === thesis.area1).long}</p>
      <p>{areas.find((area) => area.code === thesis.area2).long}</p>
    </Modal.Body>
  </Modal>
);

const UploadThesesButton = () => {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <div style={{ margin: '1rem 6em 2rem 6em', textAlign: 'center' }}>
      <Button onClick={handleShow}>Carregar Teses</Button>
      <UploadThesesModal show={show} handleClose={handleClose} />
    </div>
  );
};

const UploadThesesModal = ({ show, handleClose }) => {
  const [selectedFile, setSelectedFile] = useState();
  const [isFilePicked, setIsFilePicked] = useState(false);

  const handleChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setIsFilePicked(true);
  };

  const handleUploadTheses = () => {
    const formData = new FormData();
    formData.append('theses', selectedFile);
    axios.post('/api/theses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Carregar Teses</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Control
              type="file"
              label="Get a file with thesis on ESTUDANTE &gt; Candidatura a Dissertação &gt; Available Proposals<br />
                    * Delete everything above the theses' beggining on &lt;tbody&gt;. Delete everything after &lt;/tbody&gt;"
              onChange={handleChange}
            />
          </Form.Group>
          <Button
            variant="primary"
            onClick={() => {
              if (isFilePicked) {
                handleUploadTheses();
                handleClose();
              }
            }}
          >
            Carregar Teses
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AdminThesesPage;
