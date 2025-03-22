import React, { useEffect, useState } from "react";
import { memberRow } from "./MembersRow";
import { Table, ScrollArea } from "@mantine/core";
import { CreateMoreInfoModal } from "./modals/InformationalModal.jsx";

import style from "../../pages/css/GacPage.module.css";
import { fetchCollabsResume } from "../../Api.service.js";

export function MembersTable({ members }) {
  const [collabs, setCollabs] = useState(null);
  const [username, setUsername] = useState(null);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const handleShowMoreInfo = () => setShowMoreInfo(true);
  const handleCloseMoreInfo = () => setShowMoreInfo(false);

  const handleMoreInfo = (username) => { 
    setUsername(username);
    handleShowMoreInfo();
  };

  useEffect(() => {
    fetchCollabsResume()
      .then((collabs) => {
        setCollabs(collabs);
      })
  }, []);

  const rows = memberRow(members, collabs, handleMoreInfo);

  return (
    <>
      <CreateMoreInfoModal
        show={showMoreInfo}
        handleClose={handleCloseMoreInfo}
        username={username}
      />
      <ScrollArea>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nome</Table.Th>
              <Table.Th className={style.EmailTable}>Email</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
    </>
  );
};
