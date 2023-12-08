import React, { useState } from "react";
import { MdEmail, MdAutorenew, MdDownload } from "react-icons/md";
import { Button, Tooltip } from "@mantine/core";

import style from "../../pages/css/GacPage.module.css";
import { CreateEmailsModal } from "./modals/EmailsModal.jsx";
import { CreateRenewMembersModal } from "./modals/RenewMembersModal.jsx";
import { downloadActiveMembersFile } from "../functions/exportXLSX.js";
import useWindowSize from "../../hooks/useWindowSize.jsx";

export const EmailsAndRenewalButtons = ({ members }) => {
  const [showRenewMembers, setshowRenewMembers] = useState(false);
  const handleCloseNonActive = () => setshowRenewMembers(false);
  const handleshowRenewMembers = () => setshowRenewMembers(true);

  const [showRenewEmails, setShowRenewEmails] = useState(false);
  const handleShowRenewEmails = () => setShowRenewEmails(true);
  const handleCloseRenewEmails = () => setShowRenewEmails(false);

  const [showRegularEmails, setShowRegularEmails] = useState(false);
  const handleShowRegularEmails = () => setShowRegularEmails(true);
  const handleCloseRegularEmails = () => setShowRegularEmails(false);

  const windowSize = useWindowSize();

  return (
    <div className={style.buttonsDiv}>
      <CreateAllModals 
        members={members}
        handleCloseNonActive={handleCloseNonActive}
        handleCloseRegularEmails={handleCloseRegularEmails}
        handleCloseRenewEmails={handleCloseRenewEmails}
        showRenewMembers={showRenewMembers}
        showRegularEmails={showRegularEmails}
        showRenewEmails={showRenewEmails}
      />
      <Tooltip
        events={windowSize.innerWidth <= 800 ? { hover: false } : {}}
        position="top"
        withArrow
        transitionProps={{ duration: 500 }}
        label="Download XLSX com Sócios Ativos"
      >
        <Button
          color="orange"
          onClick={downloadActiveMembersFile}
        >
          <MdDownload size="1.25em" />
        </Button>
      </Tooltip>
      <Tooltip
        position="top"
        withArrow
        transitionProps={{ duration: 500 }}
        label="Ver Emails de Sócios Regulares"
      >
        <Button
          leftIcon={<MdEmail size="1.25em" />}
          onClick={handleShowRegularEmails}
        >
          Sócios Regulares
        </Button>
      </Tooltip>
      <Tooltip
        position="top"
        withArrow
        transitionProps={{ duration: 500 }}
        label="Ver Emails de Sócios Eleitores"
      >
        <Button
          leftIcon={<MdEmail size="1.25em" />}
          onClick={handleShowRenewEmails}
        >
          Sócios Eleitores
        </Button>
      </Tooltip>
      <Tooltip
        position="top"
        withArrow
        transitionProps={{ duration: 500 }}
        label="Ver Sócios em estado de Renovação"
      >
        <Button
          color="red"
          leftIcon={<MdAutorenew size="1.25em" />}
          onClick={handleshowRenewMembers}
        >
          Renovações
        </Button>
      </Tooltip>
    </div>
  );
};

const CreateAllModals = ({
  members,
  showRegularEmails,
  handleCloseRegularEmails,
  showRenewEmails,
  handleCloseRenewEmails,
  showRenewMembers,
  handleCloseNonActive,
}) => (
  <>
    <CreateEmailsModal
      show={showRegularEmails}
      handleClose={handleCloseRegularEmails}
      members={members.filter((member) => member.status === "SocioRegular")}
    />
    <CreateEmailsModal
      show={showRenewEmails}
      handleClose={handleCloseRenewEmails}
      members={members.filter(
        (member) =>
          member.status === "SocioEleitor" || member.status === "Renovar"
      )}
    />
    <CreateRenewMembersModal
      show={showRenewMembers}
      handleClose={handleCloseNonActive}
      members={members?.filter((member) => member.status === "Renovar")}
    />
  </>
);
