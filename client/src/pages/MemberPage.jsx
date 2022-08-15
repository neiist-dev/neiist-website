import React, { useState, useEffect, useContext } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import axios from 'axios';
import UserDataContext from '../UserDataContext';

const MembersPage = () => {
  const { userData } = useContext(UserDataContext);
  const [member, setMember] = useState(null);

  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/members/${userData.username}`)
      .then((res) => res.json())
      .then(
        (fetchMember) => {
          setMember(fetchMember);
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
  if (!member) return <Register />;
  if (member.isExpired) return <Renew />;
  if (member.canVote) return <Vote />;
  return <CantVote />;
};

const Register = () => {
  const { userData } = useContext(UserDataContext);

  const handleNewMember = async () => {
    const member = {
      username: userData.username,
      name: userData.name,
      email: userData.email,
    };
    await axios.post('/api/members', member);
  };

  return (
    <div style={{ margin: '2rem 20vw', textAlign: 'center' }}>
      <Button onClick={handleNewMember}>
        REGISTAR
      </Button>
    </div>
  );
};

const CantVote = () => (
  <div style={{ margin: '2rem 20vw', textAlign: 'center' }}>
    <p>AINDA NÃO PODES VOTAR</p>
  </div>
);

const Vote = () => {
  const [elections, setElections] = useState(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/elections')
      .then((res) => res.json())
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

  if (!isLoaded) return <div>...</div>;
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
      <>
        <h1 style={{ textAlign: 'center', margin: 0 }}>
          {elections.length}
          {' '}
          Eleições
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
      </>
    );
  }
  return <div>Não foi possível carregar as eleições.</div>;
};

const ElectionCard = ({ election }) => {
  const { userData } = useContext(UserDataContext);

  const [selectedOption, setSelectedOption] = useState(election.options[0].id);
  const handleSelectedOptionChange = (option) => setSelectedOption(option);

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleNewVote = async () => {
    const vote = {
      username: userData.username,
      electionId: election.id,
      optionId: selectedOption,
    };
    await axios.post(`/api/elections/${election.id}/votes`, vote);
  };

  return (
    <>
      <Card
        style={{ margin: '10px', width: '15rem', textAlign: 'center' }}
        onClick={handleShow}
      >
        <Card.Body>
          <Card.Title>{election.name}</Card.Title>
        </Card.Body>
      </Card>

      <Modal size="lg" show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{election.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Em quem queres votar?</Form.Label>
              <Form.Control as="select" value={selectedOption} onChange={(e) => handleSelectedOptionChange(e.currentTarget.value)}>
                {election.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <br />
            <Button
              variant="primary"
              onClick={() => {
                handleNewVote();
                handleClose();
              }}
            >
              Submeter Voto
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

const Renew = () => {
  const { userData } = useContext(UserDataContext);

  const nameAndEmail = {
    name: userData.name,
    email: userData.email,
  };

  return (
    <div style={{ margin: '2rem 20vw', textAlign: 'center' }}>
        <Button
          onClick={() => {
            axios.put(`/api/members/${userData.username}`, nameAndEmail);
          }}
      >
        RENOVAR
      </Button>
    </div>
  );
};

export default MembersPage;
