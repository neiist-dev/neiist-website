import React, { useState, useEffect } from "react";
import Button from 'react-bootstrap/Button';
import Modal from "react-bootstrap/Modal";
import Spinner from "react-bootstrap/Spinner";

import {
  fenixPhoto,
  summarizeName,
} from "../../functions/dataTreatment.jsx";

import style from '../../../pages/css/GacPage.module.css';
import { fetchMemberRenewalNotifications } from "../../../Api.service.js";

import axios from 'axios';

export const CreateRenewMembersModal = ({ show, handleClose, members }) => {
  var nonActiveEmails = "";

  const [isLoaded, setIsLoaded] = useState(false);
  const [membersRenew, setMembersRenew] = useState(null);
  const [AllSentString, setAllSentString] = useState("Todos Avisados!");

  useEffect(() => {
    if (!membersRenew || !isLoaded) {
      fetchMemberRenewalNotifications()
        .then((member) => {
          setMembersRenew(member);
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