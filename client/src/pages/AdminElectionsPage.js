import React, { useState, useEffect, useContext } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import axios from "axios";

const AdminElectionsPage = () => (
  <>
    <ViewElections />
    <CreateElectionButton />
  </>
);

const ViewElections = () => {
  const [elections, setElections] = useState(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_ROOT_API}/elections`)
      .then((res) => res.json())
      .then(
        (res) => {
          setElections(res);
          setIsLoaded(true);
        },
        (err) => {
          setIsLoaded(true);
          setError(err);
        }
      );
  }, []);

  if (!isLoaded) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (elections)
    return (
      <>
        <h1 style={{ textAlign: "center", margin: 0 }}>
          {elections.length} Active Elections
        </h1>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignContent: "space-around",
            flexWrap: "wrap",
            padding: "0 10px 10px 10px",
          }}
        >
          {elections.map((election) => (
            <ElectionCard key={election.id} election={election} />
          ))}
        </div>
      </>
    );
};

const ElectionCard = ({ election }) => {
  const [options, setOptions] = useState(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_ROOT_API}/elections/${election.id}`)
      .then((res) => res.json())
      .then(
        (res) => {
          setOptions(res);
          setIsLoaded(true);
        },
        (err) => {
          setIsLoaded(true);
          setError(err);
        }
      );
  }, []);

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Card
        style={{ margin: "10px", width: "15rem", textAlign: "center" }}
        onClick={handleShow}
      >
        <Card.Body>
          <Card.Title>{election.name}</Card.Title>
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

const ElectionModal = ({ election, show, handleClose }) => {
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_ROOT_API}/votes/${election.id}`)
      .then((res) => res.json())
      .then(
        (res) => {
          setResults(res);
          setIsLoaded(true);
        },
        (err) => {
          setIsLoaded(true);
          setError(err);
        }
      );
  }, []);

  return (
    <Modal size="lg" show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{election.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h2>ID</h2>
        <p>{election.id}</p>
        <h2>Nome</h2>
        <p>{election.name}</p>
        <h2>Data de Início</h2>
        <p>{election.startDate}</p>
        <h2>Data de Fim</h2>
        <p>{election.endDate}</p>
        {results && (
          <>
            <h2>Resultados</h2>
            {results.map((result) => (
              <p>
                {result.name}: {result.count}
              </p>
            ))}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

const CreateElectionButton = () => {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Button onClick={handleShow}>Criar Eleição</Button>
      <CreateElectionModal show={show} handleClose={handleClose} />
    </>
  );
};

const CreateElectionModal = ({ show, handleClose }) => {
  const [name, setName] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [options, setOptions] = useState(null);

  const handleNewElection = async () => {
    const newElection = {
      name: name,
      startDate: startDate,
      endDate: endDate,
      options: options.split(","),
    };
    await axios.post(`${process.env.REACT_APP_ROOT_API}/elections`, newElection);
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
            Submit
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AdminElectionsPage;
