import React, { useState, useEffect } from "react";
import useWindowSize from "../hooks/useWindowSize";
import LoadSpinner from "../hooks/loadSpinner";
import { MdEmail, MdAutorenew } from "react-icons/md";
import { Button, Badge, Tooltip } from '@mantine/core';
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { Tabs } from "@mantine/core";

import { MembersTable } from "../components/gacPage/MembersTable";

import style from "./css/GacPage.module.css";
import axios from "axios";
import {
  fenixPhoto,
  summarizeName,
} from "../components/functions/dataTreatment";

const GacPage = () => {
  return (
    <div>
      <Tabs style={{ margin: "2em 6em", position: "relative" }} variant="pills" color="gray" defaultValue="sociosAtivos">
        <Tabs.List style={{ display: "flex", zIndex: "2", position: "absolute", right: "0"}}>
          <Tabs.Tab style={{ fontWeight: "bold" }} value="sociosAtivos">
            Sócios Ativos
          </Tabs.Tab>
          <Tabs.Tab style={{ fontWeight: "bold" }} value="sociosAll">
            Todos os Sócios
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="sociosAtivos" pt="xs">
          <ActiveMembersPage keySelected={"active"} />
        </Tabs.Panel>
        <Tabs.Panel value="sociosAll" pt="xs">
          <AllMembersPage keySelected={"all"} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

const ActiveMembersPage = ({ keySelected }) => {
  const [activeMembers, setMembers] = useState(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (keySelected === "active" && activeMembers === null) {
      fetch("/api/mag/active")
        .then((res) => res.json())
        .then((membersRes) => {
          setMembers(membersRes);
          setIsLoaded(true);
        })
        .catch((err) => {
          setIsLoaded(true);
          setError(err);
        });
    }
  }, [keySelected]);

  return (
    <>
      {!isLoaded && <LoadSpinner />}
      {error && (
        <div>
          Erro:
          {error.message}
        </div>
      )}
      {activeMembers && isLoaded && !error && (
        <div>
          <div className={style.principalBody}>
            <h1>
              <b>Sócios Ativos</b>{" "}<span style={{fontSize: "25px"}}>({activeMembers.length})</span>
            </h1>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className={style.badgeDiv}>
                <Badge
                  style={{ width: "10em", marginRight: "10px" }}
                  variant="filled"
                  size="xl"
                >
                  {
                    activeMembers.filter(
                      (member) => member.status === "SocioRegular"
                    ).length
                  }{" "}
                  Regulares
                </Badge>
                <Tooltip
                  position="right"
                  withArrow
                  transitionProps={{ duration: 100 }}
                  label={`${
                    activeMembers.filter(
                      (member) => member.status === "SocioEleitor"
                    ).length
                  } Socios Eleitores, ${
                    activeMembers.filter(
                      (member) => member.status === "Renovar"
                    ).length
                  } em Renovação`}
                >
                  <Badge
                    style={{ width: "20em" }}
                    variant="gradient"
                    gradient={{ from: "lime", to: "red" }}
                    size="xl"
                  >
                    {
                      activeMembers.filter(
                        (member) =>
                          member.status === "SocioEleitor" ||
                          member.status === "Renovar"
                      ).length
                    }{" "}
                    Eleitores
                  </Badge>
                </Tooltip>
              </div>
              <EmailButtons members={activeMembers} />
            </div>
            <hr />
          </div>
          <MembersTable members={activeMembers} />
        </div>
      )}
    </>
  );
};

const AllMembersPage = ({ keySelected }) => {
  const [allMembers, setMembers] = useState(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (keySelected === "all" && allMembers === null) {
      fetch("/api/mag/all")
        .then((res) => res.json())
        .then((membersRes) => {
          setMembers(membersRes);
          setIsLoaded(true);
        })
        .catch((err) => {
          setIsLoaded(true);
          setError(err);
        });
    }
  }, [keySelected]);

  return (
    <>
      {!isLoaded && <LoadSpinner />}
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
              <b>Sócios Registados</b>{" "}<span style={{fontSize: "25px"}}>({allMembers.length})</span>
            </h1>
          </div>
          <hr/>
          <MembersTable members={allMembers} />
        </div>
      )}
    </>
  );
};

const EmailButtons = ({ members }) => {
  const [showRenewMembers, setshowRenewMembers] = useState(false);
  const handleCloseNonActive = () => setshowRenewMembers(false);
  const handleshowRenewMembers = () => setshowRenewMembers(true);

  const [showRenewEmails, setShowRenewEmails] = useState(false);
  const handleShowRenewEmails = () => setShowRenewEmails(true);
  const handleCloseRenewEmails = () => setShowRenewEmails(false);

  const [showRegularEmails, setShowRegularEmails] = useState(false);
  const handleShowRegularEmails = () => setShowRegularEmails(true);
  const handleCloseRegularEmails = () => setShowRegularEmails(false);

  return (
    <div className={style.buttonsDiv}>
      <Button leftIcon={<MdEmail size="1.25em"/>} onClick={handleShowRegularEmails}>
        Sócios Regulares
      </Button>
      <CreateEmailsModal
        show={showRegularEmails}
        handleClose={handleCloseRegularEmails}
        members={members.filter((member) => member.status === "SocioRegular")}
      />
      <Button leftIcon={<MdEmail size="1.25em"/>} onClick={handleShowRenewEmails}>
        Sócios Eleitores
      </Button>
      <CreateEmailsModal
        show={showRenewEmails}
        handleClose={handleCloseRenewEmails}
        members={members.filter(
          (member) =>
            member.status === "SocioEleitor" || member.status === "Renovar"
        )}
      />
      <Button color="red" leftIcon={<MdAutorenew size="1.25em"/>} onClick={handleshowRenewMembers}>
        Renovações
      </Button>
      <CreateRenewMembersModal
        show={showRenewMembers}
        handleClose={handleCloseNonActive}
        members={members?.filter((member) => member.status === "Renovar")}
      />
    </div>
  );
};

const CreateEmailsModal = ({ show, handleClose, members }) => {
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

const CreateRenewMembersModal = ({ show, handleClose, members }) => {
  var nonActiveEmails = "";

  const [isLoaded, setIsLoaded] = useState(false);
  const [membersRenew, setMembersRenew] = useState(null);
  const [AllSentString, setAllSentString] = useState("Todos Avisados!");

  useEffect(() => {
    if (!membersRenew || !isLoaded) {
      fetch(`/api/mag/renewalNotifications`)
        .then((res) => res.json())
        .then((fetchMember) => {
          setMembersRenew(fetchMember);
          setIsLoaded(true);
          setAllSentString("Todos Avisados!");
        });
    }
  }, [membersRenew, isLoaded]);

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

  const copyNonActiveWarnedEmails = () => {
    const emails = members
      .filter(
        (member) =>
          membersRenew.filter(
            (memberRenew) => memberRenew.username === member.username
          ).length === 0
      )
      .map((member) => member.email)
      .join(",");
    return navigator.clipboard.writeText(emails);
  };

  const emailSent = async (member) => {
    await axios.post(`/api/mag/warnedMember/${member.username}`);
  };

  const emailSentAndSet = async (member) => {
    emailSent(member);
    setMembersRenew([...membersRenew, { username: member.username }]);
  };

  const allEmailSent = () => {
    setAllSentString(
      <Spinner
        style={{ scale: ".50", margin: "0", position: "absolute", top: "0" }}
        animation="border"
        variant="warning"
      />
    );
    const warnedMembers = members.filter(
      (member) =>
        membersRenew.filter(
          (memberRenew) => memberRenew.username === member.username
        ).length === 0
    );
    Promise.allSettled(warnedMembers.map((member) => emailSent(member)));
    setIsLoaded(false);
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} dialogClassName={style.modal85}>
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
        <Modal.Body className={style.modalBody}>
          {membersRenew && members?.length > membersRenew.length && (
            <div className={style.btnsHeader}>
              <Button
                className={
                  members?.length > membersRenew?.length
                    ? `${style.btnCopyEmailsBody}`
                    : `${style.btnCopyEmailsBodyDisabled} disabled`
                }
                onClick={copyNonActiveWarnedEmails}
              >
                Copiar Emails (Não Avisados)
              </Button>
              <Button
                className={
                  members?.length > membersRenew?.length
                    ? `${style.btnCopyEmailsBody}`
                    : `${style.btnCopyEmailsBodyDisabled} disabled`
                }
                onClick={allEmailSent}
              >
                {AllSentString}
              </Button>
            </div>
          )}
          <div className={style.messageDiv}>
            <p>
              Sócios com estatuto 'Renovar' devem ser comunicados por email, informando que o
              estatudo de sócio eleitor irá expirar brevemente.
            </p>
          </div>
          <AllNonActiveCardMembers
            members={members}
            isLoaded={isLoaded}
            membersRenew={membersRenew}
            emailSent={emailSentAndSet}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

const AllNonActiveCardMembers = ({
  members,
  isLoaded,
  membersRenew,
  emailSent,
}) => (
  <div className={style.allNonActiveCard}>
    {Object.values(members).map((member, index) => (
      <div key={index} className={style.nonActiveCard}>
        <RenewMemberRectangular
          member={member}
          isLoaded={isLoaded}
          membersRenew={membersRenew}
          emailSent={emailSent}
        />
      </div>
    ))}
  </div>
);

const RenewMemberRectangular = ({
  member,
  isLoaded,
  membersRenew,
  emailSent,
}) => {
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
    <>
      <div
        className={style.nonActiveCard_img}
        style={{
          backgroundImage: `url(${fenixPhoto(member.username)})`,
        }}
      />
      <div className={style.nonActiveInfo}>
        <b>
          {summarizeName(member.name)}
          <p id={style.username}> ({member.username})</p>
          <br />
          Periodo:{" "}
        </b>
        <p id={style.period}>
          {member.renewStartDate} - {member.renewEndDate}
        </p>
      </div>
      <div className={style.buttonDiv}>
        <Button
          onClick={() => emailSent(member)}
          style={
            membersRenew?.filter((x) => x.username === member?.username)
              .length === 0
              ? { backgroundColor: "lightcoral", borderColor: "lightcoral" }
              : { backgroundColor: "green", borderColor: "green" }
          }
          className={
            membersRenew?.filter((x) => x.username === member?.username)
              .length > 0 && `disabled`
          }
        >
          {isLoaded && membersRenew
            ? membersRenew.filter((x) => x.username === member.username)
                .length === 0
              ? "Avisado? ❌"
              : "Avisado! ✅"
            : "Verificando..."}
        </Button>
        <Button onClick={() => sendEmail(member)}>Enviar Mail</Button>
        <Button onClick={() => copyEmail(member)}>Copiar Mail</Button>
      </div>
    </>
  );
};

export default GacPage;
