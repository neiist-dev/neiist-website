import React, { useState, useEffect } from "react";
import useWindowSize from "../hooks/useWindowSize";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from 'react-bootstrap/Form';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

import style from "./css/GacPage.module.css";
import axios from "axios";

const GacPage = () => {
  const [key, setKey] = useState('active');

  return (
    <div>
      <Tabs
        id="controlled-tab-example"
        className={style.tabs}
        activeKey={key}
        onSelect={(newKey) => setKey(newKey)}
        justify
      >
        <Tab eventKey="active" title="Ativos">
          <ActiveMembersPage
            keySelected={key}
          />
        </Tab>
        <Tab eventKey="search" title="Pesquisa">
          <div className={style.principalBody}>
            TO BE IMPLEMENTED
          </div>
        </Tab>
        <Tab eventKey="all" title="Todos">
          <AllMembersPage
            keySelected={key}
          />
        </Tab>
      </Tabs>
    </div>
  );
};

const ActiveMembersPage = ({ keySelected }) => {
  const [activeMembers, setMembers] = useState(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (keySelected === 'active' && activeMembers === null) {
      fetch("/api/mag/active")
        .then((res) => res.json())
        .then(
          (membersRes) => {
            setMembers(membersRes);
            setIsLoaded(true);
          })
        .catch(
          (err) => {
            setIsLoaded(true);
            setError(err);
          }
        );
    }
  }, [keySelected]);

  return (
    <>
      {!isLoaded && <div>...</div>}
      {error && (
        <div>
          Erro:
          {error.message}
        </div>
      )}
      {activeMembers && isLoaded && !error &&
        <div>
          <div className={style.principalBody}>
            <h1>
              <b>Membros ativos:</b> {activeMembers.length} Membros (
              {
                activeMembers.filter(
                  (member) =>
                    member.status === "SocioEleitor" ||
                    member.status === "Renovar"
                ).length
              }{" "}
              Ativos)
            </h1>
            <EmailButtons members={activeMembers} />
            <br />
            <div className={style.messageDiv}>
              <p>
                'Não Sócios' devem ser comunicados por email, informando que o
                estatudo de sócio eleitor expirou e que tem até X se pretender
                renovar.
              </p>
            </div>
          </div>
          <MembersTable members={activeMembers} />
        </div>
      }
    </>
  );
}

const AllMembersPage = ({ keySelected }) => {
  const [allMembers, setMembers] = useState(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (keySelected === 'all' && allMembers === null) {
      fetch("/api/mag/all")
        .then((res) => res.json())
        .then(
          (membersRes) => {
            setMembers(membersRes);
            setIsLoaded(true);
          })
        .catch(
          (err) => {
            setIsLoaded(true);
            setError(err);
          }
        );
    }
  }, [keySelected]);

  return (
    <>
      {!isLoaded && <div>...</div>}
      {error && (
        <div>
          Erro:
          {error.message}
        </div>
      )}
      {allMembers && (
        <div>
          <div className={style.principalBody}>
            <h1>
              <b>Membros Registados:</b> {allMembers.length}
            </h1>
          </div>
          <MembersTable members={allMembers} />
        </div>
      )}
    </>
  );
}

const EmailButtons = ({ members }) => {
  const [showNonActive, setShowNonActive] = useState(false);
  const handleCloseNonActive = () => setShowNonActive(false);
  const handleShowNonActive = () => setShowNonActive(true);

  const [showAll, setShowAll] = useState(false);
  const handleShowAll = () => setShowAll(true);
  const handleCloseAll = () => setShowAll(false);

  return (
    <div className={style.buttonsDiv}>
      <Button onClick={handleShowAll}>Todos os Emails</Button>
      <CreateAllActiveEmailsModal
        show={showAll}
        handleClose={handleCloseAll}
        members={members}
      />

      <Button onClick={handleShowNonActive}>Renovações</Button>
      <CreateNonActiveEmailsModal
        show={showNonActive}
        handleClose={handleCloseNonActive}
        members={members?.filter((member) => member.status === "Renovar")}
      />
    </div>
  );
};

const CreateMoreInfoModal = ({ show, handleClose, username }) => {
  const [error, setError] = useState(null);
  const [member, setMember] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setError(null);
    if (username !== null) {
      fetch(`/api/members/${username}`)
        .then((res) => res.json())
        .then(
          (fetchMember) => {
            setMember(fetchMember);
            setIsLoaded(true);
          })
        .catch(
          (err) => {
            setIsLoaded(true);
            setError(err);
          }
        );
    }
  }, [username]);

  if (member)
    return (
      <Modal size="lg" show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title className={style.modalTitle}>
            INFORMAÇÂO DE {String(member.username).toUpperCase()}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!isLoaded && <div>Loading...</div>}
          {error && <div>Error: {error}</div>}
          {member !== null && isLoaded && (
            <div className={style.infoCard}>
              <div
                className={style.infoCard_img}
                style={{
                  backgroundImage: `url(https://fenix.tecnico.ulisboa.pt/user/photo/${member.username})`,
                }}
              />
              <div className={style.infoCard_info}>
                <b>
                  {member.username} <br />
                  <p>{member.name}</p>
                  <br />
                  <p style={{ fontSize: "18px", color: "darkblue" }}>
                    ({member.courses})
                  </p>
                  <br />
                  {member.email}
                  <br />
                  <br />
                </b>
                <div id={style.tableDiv}>
                  <table>
                    <thead>
                      <tr>
                        <th>Registo</th>
                        <th>Sócio Eleitor</th>
                        <th style={{ width: "45%" }}>Renovação</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th>{member.registerDate}</th>
                        <th>{member.canVoteDate}</th>
                        <th>
                          {member.renewStartDate} - {member.renewEndDate}
                        </th>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <br />
                {member.status !== 'NaoSocio' &&
                  <DeleteButton
                    member={member}
                    handleClose={handleClose}
                  />
                }
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    );
};

const DeleteButton = ({
  member, handleClose
}) => {
  const [remove, setRemove] = useState(true);
  const [memberToRemove, setmemberToRemove] = useState('');

  const handleSubmit = (event, username, member) => {
    event.preventDefault();
    if (username === member.username)
      axios.put(`/api/mag/delete/${username}`)
        .then(() => { handleClose(); window.location.reload(false) });
  }

  return (
    <div>
      <Button
        style={remove
          ? {
            backgroundColor: 'darkRed',
            borderColor: 'darkRed',
            color: 'white',
            position: 'absolute',
            float: 'left',
            width: '100px'
          }

          : (memberToRemove === member.username)
            ? {
              backgroundColor: 'darkGreen',
              borderColor: 'darkGreen',
              color: 'white',
              position: 'absolute',
              float: 'right',
              right: '0',
              width: '100px'
            }
            : {
              backgroundColor: 'darkRed',
              borderColor: 'darkRed',
              color: 'white',
              position: 'absolute',
              float: 'right',
              right: '0',
              width: '100px'
            }
        }
        onClick={(event) => {
          if (memberToRemove === member.username)
            handleSubmit(event, memberToRemove, member);
          else
            setRemove(!remove);
        }}
      >
        Delete
      </Button>
      <div>
        <Form onSubmit={(event) => { handleSubmit(event, memberToRemove, member) }}>
          <fieldset disabled={remove}>
            <Form.Control
              id="disabledTextInput"
              type="Text"
              style={remove
                ? { display: 'none', visibility: 'hidden' }
                : { position: 'absolute', float: 'right', width: '400px' }
              }
              placeholder={'Para Remover o sócio, digite: ' + member.username}
              value={memberToRemove}
              onChange={(event) => setmemberToRemove(event.target.value)}
            />
          </fieldset>
        </Form>
      </div>
    </div>
  );
};

const CreateAllActiveEmailsModal = ({ show, handleClose, members }) => {
  var everyEmail = "";

  const exportEveryEmail = () => {
    var emails = [];
    members?.forEach((member) => emails.push(member.email));
    everyEmail = emails.join(",");
    return everyEmail;
  };

  const copyAllEmails = () => {
    const emails = everyEmail !== "" ? everyEmail : exportEveryEmail();
    return navigator.clipboard.writeText(emails);
  };

  return (
    <Modal size="lg" show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title className={style.modalTitle}>
          EMAILS DOS SÓCIOS ELEITORES
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div
          className={style.AllMembersCard}
          style={{ height: "75px", paddingRight: "100px" }}
        >
          <div className={style.AllMembersCard_emails}>
            {exportEveryEmail()}
          </div>
          <Button onClick={copyAllEmails}>Copiar</Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

const summarizeName = (name) => {
  const names = name.split(" ");
  return names[0] + " " + names[names.length - 1];
};

const CreateNonActiveEmailsModal = ({
  show, handleClose, members
}) => {
  var nonActiveEmails = "";

  const exportNonActiveMembersEmail = () => {
    var emails = [];
    members?.forEach((member) => emails.push(member.email));
    nonActiveEmails = emails.join(",");
    return nonActiveEmails;
  };

  const copyNonActiveEmails = () => {
    const emails =
      nonActiveEmails !== "" ? nonActiveEmails : exportNonActiveMembersEmail();
    return navigator.clipboard.writeText(emails);
  };

  const sendEmail = (member) => {
    const email = `mailto:${member.email}?subject=Renova%C3%A7%C3%A3o%20do%20Estatuto%20de%20S%C3%B3cio%20Eleitor&body=${member.name}
    +', Periodo de Renovação: +${member.renewStartDate}+' - '+ ${member.renewEndDate}`;

    return window.open(email);
  };

  const copyEmail = (member) => {
    const email = `to:${member.email} ; subject=Renovação do Estatuto de Sócio Eleitor ; BODY=${member.name}
    +', Periodo de Renovação: +${member.renewStartDate}+' - '+ ${member.renewEndDate}`;

    return navigator.clipboard.writeText(email);
  };

  return (
    <Modal size="lg" show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title className={style.modalTitle}>
          SÓCIOS EM PERIODO DE RENOVAÇÃO
        </Modal.Title>
        <Button
          className={style.btnCopyEmailsHeader}
          onClick={copyNonActiveEmails}
        >
          Copiar Emails
        </Button>
      </Modal.Header>
      <Modal.Body>
        {Object.values(members).map((member, index) => (
          <div
            key={index}
            className={style.nonActiveCard}
            style={
              index % 2 === 1
                ? { backgroundColor: "rgb(53, 209, 250,0.25)" }
                : { backgroundColor: "rgb(36, 139, 227,0.5)" }
            }
          >
            <div
              className={style.nonActiveCard_img}
              style={{
                backgroundImage: `url(https://fenix.tecnico.ulisboa.pt/user/photo/${member.username})`,
              }}
            />
            <p>
              <b>
                {summarizeName(member.name)}
                <br />
                Periodo:
              </b>
              <p id={style.period}>
                {member.renewStartDate} - {member.renewEndDate}
              </p>
            </p>
            <Button onClick={() => sendEmail(member)}>Enviar Mail</Button>
            <Button style={{ top: "55%" }} onClick={() => copyEmail(member)}>
              Copiar Mail
            </Button>
          </div>
        ))}
      </Modal.Body>
    </Modal>
  );
};

const MembersTable = ({ members }) => {
  const windowSize = useWindowSize();

  const [username, setUsername] = useState(null);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const handleShowMoreInfo = () => setShowMoreInfo(true);
  const handleCloseMoreInfo = () => setShowMoreInfo(false);

  const handleMoreInfo = (username) => {
    setUsername(username);
    handleShowMoreInfo();
  };

  return (
    <div className={style.principalTable}>
      <CreateMoreInfoModal
        show={showMoreInfo}
        handleClose={handleCloseMoreInfo}
        username={username}
      />
      <table>
        <thead>
          <tr>
            <th></th>
            <th></th>
            <th>Username</th>
            <th>Nome</th>
            {windowSize.innerWidth > 1000 &&
              <th>E-mail</th>
            }
            {windowSize.innerWidth > 850 &&
              <th>Curso(s)</th>
            }
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(members).map((member, index) => (
            <CreateMemberRow
              key={index}
              index={index}
              member={member}
              windowSize={windowSize}
              handleMoreInfo={handleMoreInfo}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CreateMemberRow = ({
  index, member, windowSize, handleMoreInfo
}) => {
  const getName = (name) => {
    return windowSize.innerWidth > 1250 ? name : summarizeName(name);
  }

  return (
    <tr
      key={index + 1}
      className={style.fsTable}
      style={
        index % 2 === 1
          ? { backgroundColor: "rgb(53, 209, 250,0.10)" }
          : { backgroundColor: "rgb(36, 139, 227,0.25)" }
      }
    >
      <th>{index + 1}</th>
      <th>
        <div
          className={style.memberImg}
          style={{
            backgroundImage: `url(https://fenix.tecnico.ulisboa.pt/user/photo/${member.username}`,
          }}
        />
      </th>
      <th>{member.username}</th>
      <th style={{ textAlign: "left" }}>{getName(member.name)}</th>
      {windowSize.innerWidth > 1000 &&
        <th style={{ textAlign: "left" }}>{member.email}</th>
      }
      {windowSize.innerWidth > 850 &&
        <th>{member.courses}</th>
      }
      <th>
        <Button onClick={() => handleMoreInfo(member.username)}>
          <img
            style={windowSize.innerWidth < 850 ? { width: "100px" } : { width: "auto" }}
            src={`${process.env.PUBLIC_URL}/${member.status}.svg`}
          />
        </Button>
      </th>
    </tr>
  );
}

export default GacPage;
