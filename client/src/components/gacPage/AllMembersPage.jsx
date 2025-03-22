import React, { useState, useEffect } from "react";
import LoadSpinner from '../../hooks/loadSpinner.jsx';
import { MembersTable } from "./MembersTable.jsx";

import style from '../../pages/css/GacPage.module.css';
import { Button, Tooltip } from "@mantine/core";
import { downloadAllMembersFile } from "../functions/exportXLSX.js";
import { MdDownload } from "react-icons/md";
import { fetchAllMembers } from "../../Api.service.js";

export const AllMembersPage = ({ keySelected }) => {
  const [allMembers, setMembers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (keySelected === "all" && allMembers === null) {
      fetchAllMembers()
        .then((membersRes) => {
          setMembers(membersRes);
        })
        .catch((err) => {
          setError(err);
        });
    }
  }, [keySelected]);

  return (
    <>
      {error && (
        <div>
          Erro:
          {error.message}
        </div>
      )}
        <div>
          <div style={{display: 'flex', textAlign: 'left', justifyItems: 'end', justifyContent: 'space-between',alignItems: 'flex-end',flexDirection: 'row'}}>
            <h1>
              <b>Sócios Registados</b>{" "}<span style={{fontSize: "25px"}}>({allMembers?.length ?? 0})</span>
            </h1>
            <Tooltip
              position="left"
              withArrow
              transitionProps={{ duration: 500 }}
              label="Download XLSX com Sócios"
            >
              <Button
                color="orange"
                onClick={downloadAllMembersFile}
              >
                <MdDownload size="1.25em" />
              </Button>
            </Tooltip>
          </div>
          <hr/>
          {allMembers ? 
            (<MembersTable members={allMembers} />)
            :
            <LoadSpinner />
          }
        </div>
    </>
  );
};