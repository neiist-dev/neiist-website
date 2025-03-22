import React, { useState, useEffect, lazy } from "react";

import { BsQuestionLg } from "react-icons/bs";
import LoadSpinner from "../hooks/loadSpinner.jsx";

import allMembers from "../images/colaboradores/all.png";
import { getCollabImage } from "../components/functions/collabsGeneral.jsx";

const OurTeamsDiv = lazy(() => import("../components/aboutPage/OurTeamsDiv.jsx"));
const DivPersonCard = lazy(() => import("../components/aboutPage/CollabCard.jsx"));

import "./../App.css";
import style from "./css/AboutPage.module.css";
import collabs from "../images/colaboradores/collaborators.json";
import { normalizeJob } from "../components/functions/dataTreatment.jsx";
import { fetchCollabsResume } from "../Api.service.js";

const lectiveYear = collabs.anoLetivo;

const AboutPage = () => {
  const [activeMembers, setActiveMembers] = useState(null);
  const [activeMembersError, setActiveMembersError] = useState(null);

  useEffect(() => {
    fetchCollabsResume()
      .catch((err) => setActiveMembersError(err))
      .then((res) => {
        setActiveMembers(res);
      });
  }, []);

  return (
    <>
      <div className={style.front}>
        <HeaderDiv activeMembersLength={activeMembers?.length} />
        <OurTeamsDiv activeMembers={activeMembers} />
      </div>

      {Object.entries(collabs.orgaosSociais).map(
        ([socialEntity, members], index) => (
          <SocialEntityDiv
            key={index}
            socialEntity={socialEntity}
            members={members}
          />
        )
      )}

      {!activeMembers ? (
        !activeMembersError && <LoadSpinner />
      ) : (
        <ActiveMembersDiv activeMembers={activeMembers} />
      )}
    </>
  );
};

const ActiveMembersDiv = ({ activeMembers }) => (
  <div className={style.allMembersDiv}>
    <h2>{`Membros Ativos ${lectiveYear}`}</h2>
    <div className={style.allMembersCard}>
      {activeMembers.map((member, index) => (
        <DivPersonCard
          key={index}
          name={`${member.name.split(" ")[0]}\n${member.name.split(" ")[1]}`}
          image={getCollabImage(member.name)}
        />
      ))}
    </div>
  </div>
);

const SocialEntityDiv = ({ socialEntity, members }) => (
  <div className={style.socialOrgansDiv}>
    <h2>{socialEntity + " " + lectiveYear}</h2>
    <div className={style.socialOrgansCard}>
      {Object.entries(members).map(([job, name], index) => (
        <DivPersonCard
          key={index}
          name={name}
          job={normalizeJob(job)}
          image={getCollabImage(name)}
        />
      ))}
    </div>
  </div>
);

const HeaderDiv = ({ activeMembersLength }) => (
  <div className={style.header}>
    <div style={{ height: "100%" }}>
      <div style={{ display: "flex" }}>
        <div>
          <h1>Quem somos</h1>
          <div className={style.line}>
            <h1>Quem somos</h1>
          </div>
        </div>
        <BsQuestionLg className={style.question} />
      </div>
      <p>
        A equipa do NEIIST é composta por <span>{activeMembersLength ?? "??"}</span> estudantes do Instituto Superior Técnico, motivados e interessados em ajudar todos os alunos da sua instituição que têm interesse nas mais diversas áreas da Informática. Todos os colaboradores contribuem com o seu esforço, dedicação e tempo para organizarem uma ampla variedade de atividades que visam auxiliar a comunidade académica a ter o melhor percurso e proveito académico possível.
      </p>
    </div>
    <div className={style.allColabImage}>
      <div className={style.blobs}>
        <svg
          width="616"
          height="326"
          viewBox="0 0 616 326"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M199.5 41.5C2.2189 112.748 -50 140 50.5 238.5C308 477 225.61 97.6013 346.5 225.5C450 335 583 373 610 246C640.189 104 547 -84 199.5 41.5Z"
            fill="#2863FD"
          />
        </svg>
        <svg
          width="572"
          height="398"
          viewBox="0 0 572 398"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M377.559 381.487C600.785 304.762 579.94 226.446 559.605 151.238C559.204 149.755 558.492 148.239 557.619 146.974C423.841 -46.8398 221.646 375.181 277.621 168.233C338 -54.9998 130.156 -26.7165 26.2052 86.7316C-72.9994 195 129.606 466.711 377.559 381.487Z"
            fill="#35D1FA"
          />
        </svg>

        <img src={allMembers} />
      
      </div>
    </div>
  </div>
);

export default AboutPage;
