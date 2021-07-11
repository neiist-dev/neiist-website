import React, { useState, useEffect, useContext } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Card from "react-bootstrap/Card";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import ToggleButton from "react-bootstrap/ToggleButton";
import { Redirect, Link } from "react-router-dom";
import { UserDataContext } from "../App";
import axios from "axios";

const MembersPage = () => {
  const { userData } = useContext(UserDataContext);
  const [member, setMember] = useState(null);

  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_ROOT_API}/members/${userData.username}`)
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
    <Button
      onClick={() =>
        axios.post(`${process.env.REACT_APP_ROOT_API}/members/${userData.username}`)
      }
    >
      REGISTAR
    </Button>
  );
};

const CantVote = () => (
  <p style={{ textAlign: "center" }}>AINDA NAO PODES VOTAR</p>
);

const Vote = () => {
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

      <Modal size="lg" show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{election.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {options &&
            options.map((option) => (
              <OptionCard key={option.id} option={option} election={election} />
            ))}
        </Modal.Body>
      </Modal>
    </>
  );
};

const OptionCard = ({ option, election }) => {
  const { userData } = useContext(UserDataContext);

  return (
    <Card
      style={{ margin: "10px", width: "15rem", textAlign: "center" }}
      onClick={() => {
        const vote = {
          username: userData.username,
          electionId: election.id,
          optionId: option.id,
        };
        axios.post(`${process.env.REACT_APP_ROOT_API}/votes`, vote);
      }}
    >
      <Card.Body>
        <Card.Title>{option.name}</Card.Title>
      </Card.Body>
    </Card>
  );
};

const Renew = () => {
  const { userData } = useContext(UserDataContext);

  return (
    <Button
      onClick={() => {
        // axios.post(`${process.env.REACT_APP_ROOT_API}/members/${userData.username}`)
      }}
    >
      RENOVAR
    </Button>
  );
};

export default MembersPage;
