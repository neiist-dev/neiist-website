import React, { useState, useEffect } from "react";
import LoadSpinner from "../hooks/loadSpinner";
import { Badge, Tooltip } from "@mantine/core";
import { Tabs } from "@mantine/core";

import { MembersTable } from "../components/gacPage/MembersTable";

import style from "./css/GacPage.module.css";
import { AllMembersPage } from "../components/gacPage/AllMembersPage";
import { EmailsAndRenewalButtons } from "../components/gacPage/EmailsAndRenewalButtons";

const GacPage = () => (
  <div>
    <Tabs
      className={style.mainPage}
      variant="pills"
      color="gray"
      defaultValue="sociosAtivos"
    >
      <Tabs.List
        style={{
          display: "flex",
          zIndex: "2",
          position: "absolute",
          right: "0",
        }}
      >
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
        <RenderActiveMembersDiv activeMembers={activeMembers} />
      )}
      ;
    </>
  );
};

const RenderActiveMembersDiv = ({ activeMembers }) => (
  <div>
    <div className={style.principalBody}>
      <h1>
        <b>Sócios Ativos</b>{" "}
        <span style={{ fontSize: "25px" }}>({activeMembers.length})</span>
      </h1>
      <div className={style.badgeAndEmailButtons}>
        <div className={style.badgeDiv}>
          <Badge
            className={style.initialBadge}
            variant="filled"
            size="xl"
          >
            {
              activeMembers.filter((member) => member.status === "SocioRegular")
                .length
            }{" "}
            Regulares
          </Badge>
          <Tooltip
            position="right"
            withArrow
            transitionProps={{ duration: 100 }}
            label={`${
              activeMembers.filter((member) => member.status === "SocioEleitor")
                .length
            } Socios Eleitores, ${
              activeMembers.filter((member) => member.status === "Renovar")
                .length
            } em Renovação`}
          >
            <Badge
              className={style.initialBadge}
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
        <EmailsAndRenewalButtons members={activeMembers} />
      </div>
      <hr />
    </div>
    <MembersTable members={activeMembers} />
  </div>
);

export default GacPage;
