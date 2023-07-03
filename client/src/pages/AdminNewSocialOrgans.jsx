import React, { forwardRef, useEffect, useState } from "react";
import { Group, Avatar, Text, Select, Grid } from "@mantine/core";
import collabs from '../images/colaboradores/collaborators.json';
import { fenixPhoto, normalizeJob, summarizeName } from "../components/functions/dataTreatment";
import style from "./css/AboutPage.module.css";
import DivPersonCard from "../components/aboutPage/CollabCard";
import { getCollabImage } from "../components/functions/collabsGeneral";


const AdminNewSocialOrgans = () => {
  const [activeMembers, setMembers] = useState(null);
  const [nextYear, setNextYear] = useState(
    `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`
  );

  const initialSelectedValues = Object.keys(collabs.orgaosSociais).reduce(
    (acc, Orgao) => {
      acc[Orgao] = {};
      Object.keys(collabs.orgaosSociais[Orgao]).forEach((position) => {
        acc[Orgao][position] = null;
      });
      return acc;
    },
    {}
  );

  const [selectedValues, setSelectedValues] = useState(initialSelectedValues);

  useEffect(() => {
    fetch("/api/mag/active")
      .then((res) => res.json())
      .then((membersRes) => {
        const y = membersRes?.map((person) => ({
          image: fenixPhoto(person.username),
          label: person.name,
          value: person.username,
          username: person.username,
        }));
        setMembers(y);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  // Function to handle the selection change in the Select component
  const handleSelectChange = (Orgao, position, value) => {
    setSelectedValues((prevValues) => ({
      ...prevValues,
      [Orgao]: {
        ...prevValues[Orgao],
        [position]: value,
      },
    }));
  };

  console.log(selectedValues)

  return (
    <div style={{ margin: '2rem 6em 1rem 6em' }}>
      <h2 style={{ textDecoration: "underline" }}>Novos Orgãos Sociais</h2>
      <h3>
        Ano Letivo: <p style={{ display: "inline" }}>{nextYear}</p>
      </h3>
      {activeMembers && (
        <AllOrgansDiv
          activeMembers={activeMembers}
          selectedValues={selectedValues}
          handleSelectChange={handleSelectChange}
        />
      )}
      <br />
      <hr />
      <h2>Preview</h2>
      {Object.entries(selectedValues).map(
        ([socialEntity, members], index) => (
          <SocialEntityDiv
            key={index}
            socialEntity={socialEntity}
            members={members}
            activeMembers={activeMembers}
          />
        )
      )}
    </div>
  );
};

const AllOrgansDiv = ({ activeMembers, selectedValues, handleSelectChange }) => (
  Object.keys(collabs.orgaosSociais).map((Orgao) => (
    <div key={`${Orgao}`}>
      <br />
      <h3>{Orgao}</h3>
      <Grid grow gutter="sm">
        <OrganDiv
          activeMembers={activeMembers}
          selectedValues={selectedValues[Orgao]}
          handleSelectChange={handleSelectChange}
          Orgao={Orgao}
        />
      </Grid>
    </div>
  ))
);

const OrganDiv = ({ activeMembers, selectedValues, handleSelectChange, Orgao }) => (
  Object.keys(collabs.orgaosSociais[Orgao]).map((position) => (
    <Grid.Col span={3} key={`${Orgao}_${position}`}>
      <Select
        label={position.replace(/[0-9]/g, "")}
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
        onChange={(value) => handleSelectChange(Orgao, position, value)} // Call the handleSelectChange function on selection change
        value={selectedValues[position] || null} // Set the selected value based on the stored state
      />
    </Grid.Col>
  ))
);

const SelectItem = forwardRef(({ image, label, username, ...others }, ref) => (
  <div ref={ref} {...others}>
    <Group noWrap>
      <Avatar size="lg" src={image} />
      <div>
        <Text size="md" weight={500}>
          {label}
        </Text>
        <Text size="sm" opacity={0.65}>
          {username}
        </Text>
      </div>
    </Group>
  </div>
));

const SocialEntityDiv = ({ socialEntity, members, activeMembers }) => {

  const getName = (username) => activeMembers?.filter(x => x.username == username)[0]?.label; 

  return (
    <div>
      <br />
      <h3>{socialEntity}</h3>
      <div className={style.socialOrgansCard}>
        {Object.entries(members).map(([job, username], index) => (
          <DivPersonCard
            key={index}
            name={summarizeName(getName(username))}
            job={normalizeJob(job)}
            image={getCollabImage(summarizeName(getName(username)))}
            />
        ))}
      </div>
    </div>
  );
};

export default AdminNewSocialOrgans;