import { AiOutlineEye } from "react-icons/ai";
import { MdContentCopy } from "react-icons/md";
import { BsTrash3, BsCheck } from "react-icons/bs";
import {
  Avatar,
  Badge,
  Group,
  Text,
  Tooltip,
  Anchor,
  ActionIcon,
  CopyButton,
} from "@mantine/core";

import style from "../../pages/css/GacPage.module.css"
import { fenixPhoto, summarizeName } from "../functions/dataTreatment.jsx";

const colorStatus = {
  NaoSocio: "dark",
  SocioRegular: "blue",
  SocioEleitor: "lime",
  Renovar: "red",
};


export const memberRow = (members, collabs, handleMoreInfo) => {
  const rows = members?.map((member, index) => (
    <tr key={member.username} className={style.tableClass} style={index % 2 === 1
      ? { backgroundColor: "rgb(53, 209, 250,0.025)" }
      : { backgroundColor: "rgb(36, 139, 227,0.075)" }}>
      <td style={{borderRadius: "1em 0 0 1em"}}>
        <Group spacing="md">
          <Avatar size={60} src={fenixPhoto(member.username)} radius={20} />
          <div>
            <Tooltip
              withArrow
              position="right"
              transitionProps={{ duration: 200 }}
              label={member.name}
            >
              <Text fz="md" fw={500}>
                {summarizeName(member.name)}
                {collabs?.some(
                  (collab) => collab.name === summarizeName(member?.name)
                ) && " "}
                {collabs?.some(
                  (collab) => collab.name === summarizeName(member?.name)
                ) && <Badge variant="outline">Collab</Badge>}
              </Text>
            </Tooltip>
            <Text fz="sm" c="dimmed">
              {member.username}
              <Text span fz="xs">
                {` | ${member.courses.replace(",", ", ")}`}
              </Text>
            </Text>
          </div>
        </Group>
      </td>

      <td className={style.EmailTable}>
        <Anchor href={`mailto:${member.email}`} size="md">
          <Text fz="sm" fw={500}>
            {member.email}
          </Text>
        </Anchor>
      </td>
      <td>
        <Badge
          fullWidth
          size="lg"
          radius="xs"
          variant="filled"
          color={colorStatus[member.status]}
          style={{ fontFamily: "Montserrat", fontSize: "0.8rem", fontStyle: 'bold', borderRadius: "0.5em"}}
        >
          {member.status.replace(/([A-Z])/g, " $1").trim()}
        </Badge>
      </td>
      <td style={{borderRadius: "0 1em 1em 0"}}>
        <Group spacing={0} position="right">
        <Tooltip
            position="top"
            withArrow
            transitionProps={{ duration: 100 }}
            label="Ver mais informações"
          >
            <ActionIcon onClick={() => handleMoreInfo(member.username)}>
              {<AiOutlineEye size="1rem" stroke={1.5} />}
            </ActionIcon>
          </Tooltip>
          <CopyButton value={member.email} timeout={2000}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? "Copiado!" : "Copiar Email"} withArrow>
                <ActionIcon color={copied ? "teal" : "gray"} onClick={copy}>
                  {copied ? (
                    <BsCheck size="1rem" />
                  ) : (
                    <MdContentCopy size="1rem" />
                  )}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
          <Tooltip
            position="top"
            withArrow
            transitionProps={{ duration: 100 }}
            label="Eliminar Sócio"
          >
            <ActionIcon color="red" disabled>
              <BsTrash3 size="1rem" stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </td>
    </tr>
  ));

  return rows;
};