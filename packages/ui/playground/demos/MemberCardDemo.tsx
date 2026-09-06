import React from "react";
import { DemoCard } from "../components/DemoCard";
import { MemberCard, DetailCard, Badge, DropdownMenu } from "@neiist/ui";
import { FiMoreVertical, FiUserCheck, FiFileText, FiTrash2, FiEdit2 } from "react-icons/fi";
import styles from "./MemberCardDemo.module.css";

const MEMBERS = [
  {
    name: "Miguel Raposo",
    role: "Presidente da Direção",
    username: "raposo",
    githubUrl: "https://github.com/miguelraposo",
    linkedinUrl: "https://linkedin.com/in/miguel-raposo",
    image: "https://avatars.githubusercontent.com/u/10000000?v=4",
  },
  {
    name: "Inês Pereira",
    role: "Coordenadora de Informática",
    username: "inespereira",
    githubUrl: "https://github.com",
    linkedinUrl: "https://linkedin.com",
    image: "https://avatars.githubusercontent.com/u/20000000?v=4",
  },
];

export const MemberCardDemo = () => {
  return (
    <>
      <DemoCard
        title="MemberCard"
        description="Exact visual styling from about-us with interactive social overlay on hover.">
        <div className={styles.membersGrid}>
          {MEMBERS.map((member) => (
            <MemberCard key={member.username} {...member} />
          ))}
        </div>
      </DemoCard>

      <DemoCard
        title="DetailCard (Membros Ativos & Ex-Membros)"
        description="Administrative cards with custom Action Dropdown menus and membership role history.">
        <div className={styles.cardsLayout}>
          {/* Active Member Card (Matching Image 5) */}
          <DetailCard
            title="Inês Figueiredo Caldeira Belo Cachola"
            identifier="ist1106953"
            image="https://avatars.githubusercontent.com/u/20000000?v=4"
            actions={
              <DropdownMenu>
                <DropdownMenu.Trigger>
                  <button type="button" className={styles.actionBtn} aria-label="Ações de membro">
                    <FiMoreVertical size={18} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" mobileTitle="Ações do Membro">
                  <DropdownMenu.Item icon={<FiEdit2 />}>Editar Perfil</DropdownMenu.Item>
                  <DropdownMenu.Item icon={<FiFileText />}>Ver Ficha Completa</DropdownMenu.Item>
                  <DropdownMenu.Divider />
                  <DropdownMenu.Item icon={<FiTrash2 />} destructive>
                    Eliminar Conta
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            }
            metadata={[
              { label: "Email", value: "icacholaist@gmail.com" },
              { label: "Telefone", value: "965822348" },
              {
                label: "Cursos",
                value: "Engenharia Informática e de Computadores - Taguspark",
              },
              {
                label: "Equipas/Órgãos",
                value: (
                  <span className={styles.roleTag}>
                    <span className={styles.roleTeam}>Marketing & Design</span>
                    <span>-</span>
                    <span>Design Manager</span>
                    <Badge variant="outline" className={styles.badgeSmall}>
                      coordenador
                    </Badge>
                  </span>
                ),
              },
            ]}
          />

          {/* Ex-Member Card (Showing Past Roles & History Intervals) */}
          <DetailCard
            title="Rodrigo Santos"
            identifier="ist198421"
            badge={<Badge variant="danger">Ex-Membro</Badge>}
            image="https://avatars.githubusercontent.com/u/30000000?v=4"
            actions={
              <DropdownMenu>
                <DropdownMenu.Trigger>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    aria-label="Ações de ex-membro">
                    <FiMoreVertical size={18} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" mobileTitle="Ações do Ex-Membro">
                  <DropdownMenu.Item icon={<FiUserCheck />}>Reativar Sócio</DropdownMenu.Item>
                  <DropdownMenu.Item icon={<FiFileText />}>Ver Registo Completo</DropdownMenu.Item>
                  <DropdownMenu.Divider />
                  <DropdownMenu.Item icon={<FiTrash2 />} destructive>
                    Eliminar Registo
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            }
            metadata={[
              { label: "Email", value: "rodrigo.santos@tecnico.ulisboa.pt" },
              { label: "Telefone", value: "912345678" },
              {
                label: "Cursos",
                value: "Engenharia Informática e de Computadores - Alameda",
              },
              {
                label: "Histórico de Equipas & Funções",
                value: (
                  <div className={styles.roleHistoryList}>
                    <div>
                      <strong>Marketing & Design</strong> - Colaborador{" "}
                      <span className={styles.roleHistoryDates}>(01/10/2022 a 30/09/2023)</span>
                    </div>
                    <div>
                      <strong>Informática & Sistemas</strong> - Coordenador{" "}
                      <span className={styles.roleHistoryDates}>(01/10/2023 a 31/07/2024)</span>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </DemoCard>
    </>
  );
};
