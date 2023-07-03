import React, { forwardRef, useCallback, useEffect, useState } from "react";
import { Group, Avatar, Text, Select } from "@mantine/core";
import produce from "immer";

import collabs from "../images/colaboradores/collaborators.json";
import {
  fenixPhoto,
  normalizeJob,
  summarizeName,
} from "../components/functions/dataTreatment";
import DivPersonCard from "../components/aboutPage/CollabCard";
import { getCollabImage } from "../components/functions/collabsGeneral";

import style from "./css/AboutPage.module.css";

const AdminNewSocialOrgans = () => {
  const [activeMembers, setMembers] = useState(null);
  const nextYear = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

  const [selectedValues, setSelectedValues] = useState(
    Object.keys(collabs.orgaosSociais).reduce((acc, Orgao) => {
      acc[Orgao] = {};
      Object.keys(collabs.orgaosSociais[Orgao]).forEach((position) => {
        acc[Orgao][position] = null;
      });
      return acc;
    }, {})
  );

  const handleSelectChange = useCallback((Orgao, position, value) => {
    setSelectedValues(
      produce((draft) => {
        draft[Orgao][position] = value;
      })
    );
  }, []);
  
  const fetchActiveMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/mag/active");
      const membersRes = await res.json();
      const y = membersRes?.map((person) => ({
        image: fenixPhoto(person.username),
        label: person.name,
        value: person.username,
        username: person.username,
      }));
      setMembers(y);
    } catch (error) {
      console.error(error);
    }
  }, []);
  
    useEffect(() => {
      fetchActiveMembers();
    }, [fetchActiveMembers]);
  
  return (
    <div style={{ margin: "2rem 6em 1rem 6em" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <h2 style={{ textDecoration: "underline", width: "70%" }}>
          Novos Orgãos Sociais
        </h2>
        <h3 style={{ width: "30%" }}>
          Ano Letivo: <p style={{ display: "inline" }}>{nextYear}</p>
        </h3>
      </div>
      {activeMembers &&
        Object.entries(selectedValues)?.map(
          ([socialEntity, members], index) => (
            <SocialEntityDiv
              key={index}
              socialEntity={socialEntity}
              members={members}
              activeMembers={activeMembers}
              selectedValues={selectedValues}
              handleSelectChange={handleSelectChange}
            />
          )
        )}
    </div>
  );
};

const SelectItem = forwardRef(({ image, label, username, ...others }, ref) => (
  <div ref={ref} {...others}>
    <Group noWrap>
      <Avatar size="md" src={image} />
      <div>
        <Text size="sm" weight={500}>
          {label}
        </Text>
        <Text size="xs" opacity={0.65}>
          {username}
        </Text>
      </div>
    </Group>
  </div>
));

const SocialEntityDiv = ({
  socialEntity,
  members,
  activeMembers,
  selectedValues,
  handleSelectChange,
}) => {
  const getName = (username) =>
    activeMembers?.filter((x) => x.username == username)[0]?.label;

  return (
    <div>
      <br />
      <h3>{socialEntity}</h3>
      <div className={style.socialOrgansCard}>
        {Object.entries(members).map(([job, username], index) => (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <DivPersonCard
              key={index}
              name={summarizeName(getName(username))}
              job={normalizeJob(job)}
              image={getCollabImage(summarizeName(getName(username)))}
            />
            <Select
              label={normalizeJob(job)}
              placeholder="Escolhe um..."
              itemComponent={SelectItem}
              data={activeMembers}
              searchable
              dropdownPosition="bottom"
              maxDropdownHeight={250}
              nothingFound="Não existe nenhum Sócio Eleitor com esse nome."
              filter={(value, item) =>
                item.label.toLowerCase().includes(value.toLowerCase().trim()) ||
                item.username.toLowerCase().includes(value.toLowerCase().trim())
              }
              onChange={(value) => handleSelectChange(socialEntity, job, value)}
              value={selectedValues[socialEntity][job] || null}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminNewSocialOrgans;
