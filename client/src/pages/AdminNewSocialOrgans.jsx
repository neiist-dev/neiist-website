import { forwardRef, useEffect, useState } from "react";
import { Group, Avatar, Text, Select, Grid } from "@mantine/core";

import collabs from '../images/colaboradores/collaborators.json';
import { fenixPhoto } from "../components/functions/dataTreatment";

const AdminNewSocialOrgans = () => {
  const [activeMembers, setMembers] = useState(null);
  const [nextYear, setNextYear] = useState(
    `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`
  );

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

  return (
    <div style={{margin: '2rem 6em 1rem 6em'}}>
      <h2 style={{ textDecoration: "underline" }}>Novos Orgãos Sociais</h2>
      <h3>
        Ano Letivo: <p style={{ display: "inline" }}>{nextYear}</p>
      </h3>
      {activeMembers && <AllOrgansDiv activeMembers={activeMembers} />}
    </div>
  );
};

const AllOrgansDiv = ({ activeMembers }) => (
  Object.keys(collabs.orgaosSociais).map((Orgao) => (
    <div key={`${Orgao}`}>
      <br />
      <h3>{Orgao}</h3>
      <Grid grow gutter="sm">
        <OrganDiv activeMembers={activeMembers} Orgao={Orgao} />
      </Grid>
    </div>
  ))
);

const OrganDiv = ({ activeMembers, Orgao }) => (
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
          item.label
            .toLowerCase()
            .includes(value.toLowerCase().trim()) ||
          item.username
            .toLowerCase()
            .includes(value.toLowerCase().trim())
        }
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

export default AdminNewSocialOrgans;
