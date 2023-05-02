import React, { useState, useEffect, useContext } from 'react';
import LoadSpinner from "../hooks/loadSpinner";
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';

import axios from 'axios';
import UserDataContext from '../UserDataContext';

import style from './css/MemberPage.module.css'

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

  return (
    <div className={style.principalBody}>
      {(!isLoaded) && <LoadSpinner />}
      {(error) && 
        <div>
          Erro:
          {error.message}
        </div>
      }
      {(isLoaded && (!member ? 
        <MemberInformation member={userData} memberNotRegisted={true} />
          :
        <MemberInformation member={member} />
      ))}

      {(isLoaded && !member ) && <Register />}
      {(isLoaded && member && 
        (member.status==="Renovar" || member.status==="NaoSocio")) && <Renew />}
      {(isLoaded && member && member.status==="SocioEleitor") && <Vote />}
      {(isLoaded && member && member.status==="SocioRegular") && <CantVote />}
    </div> );
};

const NoRegisterDiv = ({noRegisterFlag=false}) => {
  return (
    <div>
      { (noRegisterFlag) &&
        <div 
          className={style.noRegisterDiv}
        >
        <Alert key="warning" variant="warning">
          ⚠ Dados retirados do Fênix e não presentes na nossa base de dados.
        </Alert>
        </div>
      }
    </div>
  );
};

const MemberInformation = ({member, memberNotRegisted=false}) => {

  member.status = (memberNotRegisted) ? "NaoSocio": member.status;

  // Image of Student only shows if their profile picture is public in Fenix
  return (
    <div>
      <NoRegisterDiv noRegisterFlag={memberNotRegisted}/>
      <div
        className={style.memberInfoDiv}
      >
        <div
          className={style.memberImageContainer}
        >
          <div
            className={style.memberImage}
            style={{
              backgroundImage: `url(https://fenix.tecnico.ulisboa.pt/user/photo/${member.username}?s=10000)`}}
          />
          <Badge className={style.memberCourse}>{member.courses.replaceAll(',' , ', ')}</Badge>
        </div>
        <div className={style.memberInfo}>
          <p data-testid="username-container"><b>Username:</b> {member.username}</p>
          <p data-testid="name-container"><b>Nome:</b> {member.name}</p>
          <p data-testid="email-container"><b>Email:</b> {member.email}</p>
          <p data-testid="status-container"><b>Estado Atual de Sócio:</b>
          <img
            className={style.memberInfoStatus}
            alt={member.status}
            src={`${process.env.PUBLIC_URL}/${member.status}.svg`}
          />
          </p>
        </div>
      </div>
    </div>
  );
};

const Register = () => {
  const { userData } = useContext(UserDataContext);
  
  const [show, setShow] = useState(false);
  const confirmEmailModal = () => setShow(true);
  const handleClose = () => setShow(false);

  const handleNewMember = async (confirmedEmail = userData.email) => {
    const member = {
      username: userData.username,
      name: userData.name,
      email: confirmedEmail,
      courses: userData.courses,
    };

    await axios.post('/api/members', member)
      .then((res) => { if (res) window.location.reload(); });
  };

  return (
    <div className={style.divButton}>
      <ConfirmEmailModal
        show={show}
        handleClose={handleClose}
        email={userData.email}
        returnFunction={handleNewMember}
      />
      <Button onClick={confirmEmailModal}>
        REGISTAR
      </Button>
    </div>
  );
};

const ConfirmEmailModal = ({ show, handleClose, email, returnFunction }) => {
  const [confirmedEmail, setConfirmedEmail] = useState(email);

  const validateEmail = () => {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(confirmedEmail);
  }

  const confirmEmailSubmit = (e) => {
    e.preventDefault();
    if (validateEmail()) returnFunction(confirmedEmail);
  }

  return (
    <Modal size="lg" show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className={style.modalTitle}>
          Confirma o teu email
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>
          <Alert variant="warning">
            <Alert.Heading>Meio Principal de Contacto</Alert.Heading>
            <p style={{ textAlign: "justify", textJustify: "inter-word" }}>
              Todas as comunicações que o NEIIST estabelece com os sócios são
              exclusivamente feitos através do email. Deste modo, o preenchimento do
              email neste momento é de cariz obrigatório. O <b>NEIIST</b> não se
              responsabiliza pela incorreta introdução do email (sendo esse um
              dever de cada sócio), entrando sempre em contacto pelo email
              confirmado.
              <br />
              Caso o email seja alterado durante o periodo de sócio, deverás
              informar @ Presidente da MAG de forma a alterar o email.
            </p>
          </Alert>
        </div>
        <Form
          onSubmit={confirmEmailSubmit}
          style={{ display: "flex", textAlign: "center" }}
        >
          <Form.Control
            type="email"
            style={{ float: "center", width: "100%" }}
            value={confirmedEmail}
            onChange={(e) => {
              setConfirmedEmail(e.target.value);
            }}
          />
        </Form>
        <br />
        <Button
          onClick={confirmEmailSubmit}
          style={{ display: "flex", textAlign: "center" }}
        >
          Confirmo o email
        </Button>
      </Modal.Body>
    </Modal>
  );
};

const CantVote = () => (
  <div className={style.information}>
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

  if (!isLoaded) return <LoadSpinner />;
  if (error) {
    return (
      <div>
        Erro:
        {error.message}
      </div>
    );
  }
  if (elections.length > 0) {
    return (
      <div>
        <hr/>
        <h1 style={{ textAlign: 'center', margin: 0 }}>
          {elections.length}
          {' '}
          {elections.length===1 ? 
            "Eleição"
            : 
            "Eleições"
          }
        </h1>
        <div className={style.electionCardDiv}>
          {elections.map((election) => (
            <ElectionCard key={election.id} election={election} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div
      className={style.information}
    >
      <p>{
        isLoaded && error===null && elections.length === 0 ?
        "Não existe atualmente eleições a decorrer."
        :
        "Não foi possível carregar as eleições."
      }
      </p>
    </div>
  );
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

  const [show, setShow] = useState(false);
  const confirmEmailModal = () => setShow(true);
  const handleClose = () => setShow(false);

  const handleMemberRenew = (changedEmail = userData.email) => {
    const nameEmailCourses = {
      name: userData.name,
      email: changedEmail,
      courses: userData.courses,
    };

    axios.put(`/api/members/${userData.username}`, nameEmailCourses)
      .then((res) => { if (res) window.location.reload(); });
  };

  return (
    <div className={style.divButton}>
      <ConfirmEmailModal
        show={show}
        handleClose={handleClose}
        email={userData.email}
        returnFunction={handleMemberRenew}
      />
      <Button onClick={confirmEmailModal}>
        RENOVAR
      </Button>
    </div>
  );
};

export default MembersPage;
