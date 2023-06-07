import React, { useState, useEffect } from "react";
import LoadSpinner from '../../hooks/loadSpinner';
import { MembersTable } from "./MembersTable";

import style from '../../pages/css/GacPage.module.css';

export const AllMembersPage = ({ keySelected }) => {
  const [allMembers, setMembers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (keySelected === "all" && allMembers === null) {
      fetch("/api/mag/all")
        .then((res) => res.json())
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
          <div className={style.principalBody}>
            <h1>
              <b>Sócios Registados</b>{" "}<span style={{fontSize: "25px"}}>({allMembers?.length ?? 0})</span>
            </h1>
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