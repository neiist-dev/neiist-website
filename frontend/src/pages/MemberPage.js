import React, { useState, useEffect, useContext } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Card from "react-bootstrap/Card";
import { UserDataContext } from "../App";
import axios from "axios";

const MembersPage = () => {
  const { userData } = useContext(UserDataContext);
  const [member, setMember] = useState(null);

  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/members/${userData.username}`)
      .then((res) => res.json())
      .then(
        (member) => {
          setMember(member);
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
  if (!member) return <Register />;
  if (member.isExpired) return <Renew />;
  if (member.canVote) return <Vote />;
  else return <CantVote />;
};

const Register = () => {
  const { userData } = useContext(UserDataContext);

  return (
    <div style={{ margin: "2rem 20vw", textAlign: "center" }}>
      <Button
        onClick={() =>
          axios.post(`/api/members/${userData.username}`)
        }
      >
        REGISTAR
      </Button>
    </div>
  );
};

const CantVote = () => (
  <div style={{ margin: "2rem 20vw", textAlign: "center" }}>
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
    fetch(`/api/elections/${election.id}`)
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

      <Modal size="lg" show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{election.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "center",
            alignContent: "space-around",
            flexWrap: "wrap"
          }}>
            {options &&
              options.map((option) => (
                <OptionButton key={option.id} option={option} election={election} />
              ))}
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

const OptionButton = ({ option, election }) => {
  const { userData } = useContext(UserDataContext);

  return (
    <Button
      style={{ margin: "0 10px" }}
      onClick={() => {
        const vote = {
          username: userData.username,
          electionId: election.id,
          optionId: option.id,
        };
        axios.post('/api/votes', vote);
      }}
    >
      {option.name}
    </Button>
  );
};

const Renew = () => {
  const { userData } = useContext(UserDataContext);

  return (
    <div style={{ margin: "2rem 20vw", textAlign: "center" }}>
      < Button
        onClick={() => {
          axios.put(`/api/members/${userData.username}`)
        }}
      >
        RENOVAR
      </Button >
    </div >
  );
};

export default MembersPage;
