import React, { useState, useEffect } from 'react';
import LoadSpinner from "../hooks/loadSpinner.jsx";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import { fetchAdminElections } from '../Api.service.js';

import axios from 'axios';

const AdminElectionsPage = () => (
  <>
    <CreateElectionButton />
    <ViewElections />
  </>
);

const ViewElections = () => {
  const [elections, setElections] = useState(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchAdminElections()
      .then(
        (res) => {
          setElections(res);
          setIsLoaded(true);
        },
        (err) => {
          setIsLoaded(true);
          setError(err);
        },
      );
  }, []);

  if (!isLoaded) return <LoadSpinner />;
  if (error) {
    return (
      <div>
        Erro:
        {error.message}
      </div>
    );
  }
  if (elections) {
    return (
      <div style={{ margin: '2rem 6em 1rem 6em' }}>
        <h1 style={{ textAlign: 'center', margin: 0 }}>
          Todas as eleições ({elections.length})
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
          {elections.map((election) => (
            <ElectionCard key={election.id} election={election} />
          ))}
        </div>
      </div>
    );
  }
  return <div>Não foi possível carregar as eleições.</div>;
};

const currDate = new Date();
const active = (election) => 
  currDate>=new Date(election.startDate) && currDate<=new Date(election.endDate);

const ElectionCard = ({ election }) => {
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
          <Card.Title>{election.name}</Card.Title>
          <h4 style={{color:'darkblue'}}>
            {active(election) && "ATIVA"}
          </h4>
        </Card.Body>
      </Card>
      <ElectionModal
        election={election}
        show={show}
        handleClose={handleClose}
      />
    </>
  );
};

const ElectionModal = ({ election, show, handleClose }) => (
  <Modal size="lg" show={show} onHide={handleClose} centered>
    <Modal.Header closeButton>
      <Modal.Title>{election.name}</Modal.Title>
      <h4 style={{color:'darkblue', right: '45px', position: 'absolute'}}>
        {active(election) && "ATIVA"}
      </h4>
    </Modal.Header>
    <Modal.Body>
      <h4>ID</h4>
      <p>{election.id}</p>
      <h4>Nome</h4>
      <p>{election.name}</p>
      <h4>Data de Início</h4>
      <p>{election.startDate}</p>
      <h4>Data de Fim</h4>
      <p>{election.endDate}</p>
      <h4>Resultados</h4>
      {election.options.map((option) => (
        <p key={option.id}>
          {option.name}
          :
          {option.votes}
        </p>
      ))}
    </Modal.Body>
  </Modal>
);

const CreateElectionButton = () => {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <div style={{ margin: '1rem 6em 2rem 6em', textAlign: 'center' }}>
      <Button onClick={handleShow}>Criar Eleição</Button>
      <CreateElectionModal show={show} handleClose={handleClose} />
    </div>
  );
};

const CreateElectionModal = ({ show, handleClose }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [options, setOptions] = useState('');

  const handleNewElection = async () => {
    const newElection = {
      name,
      startDate,
      endDate,
      options: options.split(','),
    };
    await axios.post('/api/elections', newElection);
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
              handleNewElection();
              handleClose();
            }}
          >
            Criar Eleição
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AdminElectionsPage;
