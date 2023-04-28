import React, { useState, useEffect } from "react";
import LoadSpinner from '../../hooks/loadSpinner';
import { MembersTable } from "./MembersTable";

import style from '../../pages/css/GacPage.module.css';

export const AllMembersPage = ({ keySelected }) => {
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