import { Button } from '@mantine/core';
import Modal from "react-bootstrap/Modal";

import style from '../../../pages/css/GacPage.module.css';

export const CreateEmailsModal = ({ show, handleClose, members }) => {
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