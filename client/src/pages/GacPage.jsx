import React, { useState, useEffect } from "react";
import LoadSpinner from "../hooks/loadSpinner.jsx";
import { Badge, Tooltip, Tabs } from "@mantine/core";
import {BiSearch} from "react-icons/bi";

import { MembersTable } from "../components/gacPage/MembersTable.jsx";

import style from "./css/GacPage.module.css";
import { SearchMembers } from "../components/gacPage/SearchMembers.jsx";
import { AllMembersPage } from "../components/gacPage/AllMembersPage.jsx";
import { EmailsAndRenewalButtons } from "../components/gacPage/EmailsAndRenewalButtons.jsx";
import { fetchActiveMembers } from "../Api.service.js";

const GacPage = () => {
  const [activeTab, setActiveTab] = useState('active');

  return (
  <div>
    <Tabs
      className={style.mainPage}
      variant="pills"
      color="gray"
      defaultValue="active"
      onTabChange={setActiveTab}
    >
      <Tabs.List className={style.tabsList}>
        <Tabs.Tab style={{ fontWeight: "bold" }} value="active">
          Sócios Ativos
        </Tabs.Tab>
        <Tabs.Tab style={{ fontWeight: "bold" }} value="all">
          Todos os Sócios
        </Tabs.Tab>
				<Tabs.Tab style={{ fontWeight: "bold" }} value="search">
          Pesquisa{"  "}
          <BiSearch size="1.25em"/>
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="active" pt="xs">
        <ActiveMembersPage keySelected={activeTab} />
      </Tabs.Panel>
      <Tabs.Panel value="all" pt="xs">
        <AllMembersPage keySelected={activeTab} />
      </Tabs.Panel>
			<Tabs.Panel value="search" pt="xs">
        <SearchMembers keySelected={activeTab} />
      </Tabs.Panel>
    </Tabs>
  </div>
  );
};

const ActiveMembersPage = ({ keySelected }) => {
  const [activeMembers, setMembers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (keySelected === "active" && activeMembers === null) {
      fetchActiveMembers()
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
      {!error && (
        <RenderActiveMembersDiv activeMembers={activeMembers}/>
      )}
    </>
  );
};

const RenderActiveMembersDiv = ({ activeMembers }) => (
  <div>
    <div className={style.principalBody}>
      <h1>
        <b>Sócios Ativos</b>{" "}
        <span style={{ fontSize: "25px" }}>({activeMembers?.length ?? 0})</span>
      </h1>
      <div className={style.badgeAndEmailButtons}>
        <div className={style.badgeDiv}>
          <Badge
            className={style.initialBadge}
            variant="filled"
            size="xl"
          >
            {
              activeMembers?.filter((member) => member.status === "SocioRegular")
                .length ?? 0
            }{" "}
            Regulares
          </Badge>
          <Tooltip
            position="right"
            withArrow
            transitionProps={{ duration: 100 }}
            label={`${
              activeMembers?.filter((member) => member.status === "SocioEleitor")
                .length ?? 0
            } Socios Eleitores, ${
              activeMembers?.filter((member) => member.status === "Renovar")
                .length ?? 0
            } em Renovação`}
          >
            <Badge
              className={style.initialBadge}
              variant="gradient"
              gradient={{ from: "lime", to: "red" }}
              size="xl"
            >
              {
              activeMembers?.filter(
                (member) =>
                  member.status === "SocioEleitor" ||
                  member.status === "Renovar"
              ).length ?? 0
              }{" "}
              Eleitores
            </Badge>
          </Tooltip>
        </div>
        {activeMembers &&
          <EmailsAndRenewalButtons members={activeMembers} />
        }
      </div>
      <hr />
    </div>
      {activeMembers ?
        <MembersTable members={activeMembers} />
        :
        <LoadSpinner/>
      }
  </div>
);

export default GacPage;
