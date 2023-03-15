import React,{useState, useEffect} from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button'
import LoadSpinner from "../hooks/loadSpinner";
import { Modal } from 'react-bootstrap';

import { BsFillCameraFill, BsQuestionLg } from "react-icons/bs";
import { FaLaptopCode, FaHandshake } from "react-icons/fa";
import { RiPenNibFill } from "react-icons/ri";
import { HiSpeakerphone } from "react-icons/hi";
import { MdEventNote } from "react-icons/md";
import { VscFeedback } from "react-icons/vsc"

import allMembers from '../images/colaboradores/all.png';

import {
  allTeamNames,
  getCollabImage,
} from "../components/functions/collabsGeneral";

import './../App.css';
import style from './css/AboutPage.module.css';
import collabs from '../images/colaboradores/collaborators.json';
import { normalizeJob } from '../components/functions/dataTreatment';

const lectiveYear = collabs.anoLetivo;

const AboutPage = () => {
  const [activeMembers, setActiveMembers] = useState(null);
  const [activeMembersError, setActiveMembersError] = useState(null);

  useEffect(() => {
    fetch(`/api/collabs/resume`)
      .then((res) => res.json())
      .catch((err) => setActiveMembersError(err))
      .then((res) => {
        setActiveMembers(res);
      });
  }, []);

  return (
  <>
    <div className={style.front}>
      <HeaderDiv />
      <OurTeamsDiv />
    </div>
    {Object.entries(collabs.orgaosSociais).map(([socialEntity, members], index)=>(
      <div key={index} className={style.socialOrgansDiv}>
        <h2>{socialEntity+' '+lectiveYear}</h2>
        <div className={style.socialOrgansCard}>
          {Object.entries(members).map(([job, name], index) => (
            <DivPersonCard key={index} 
              name={name} job={normalizeJob(job)} image={getCollabImage(name)}/>
          ))}
        </div>
      </div>
    ))}
    {(collabs.Membros.length === 0 || !activeMembers) ?
    !activeMembersError && <LoadSpinner /> :
      <div className={style.allMembersDiv}>
        <h2>{`Membros Ativos ${lectiveYear}`}</h2>
        <div className={style.allMembersCard}>
          {activeMembers.map( (member, index) => (
            <DivPersonCard key={index} name={`${member.name.split(" ")[0]}\n${member.name.split(" ")[1]}`} image={getCollabImage(member.name)}/>
          ))}
        </div>
      </div>
    }
  </>
)};

const HeaderDiv = () => (
  <div className={style.header}>
    <div>
      <div style={{display: 'flex'}}>
        <div>
          <h1>Quem somos</h1>
          <div className={style.line}>
            <h1>Quem somos</h1>
          </div>
        </div>
        <BsQuestionLg className={style.question} />
      </div>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    </div>
    <div className={style.allColabImage}>
      <svg width="616" height="326" viewBox="0 0 616 326" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M199.5 41.5C2.2189 112.748 -50 140 50.5 238.5C308 477 225.61 97.6013 346.5 225.5C450 335 583 373 610 246C640.189 104 547 -84 199.5 41.5Z" fill="#2863FD"/>
      </svg>
      <svg width="572" height="398" viewBox="0 0 572 398" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M377.559 381.487C600.785 304.762 579.94 226.446 559.605 151.238C559.204 149.755 558.492 148.239 557.619 146.974C423.841 -46.8398 221.646 375.181 277.621 168.233C338 -54.9998 130.156 -26.7165 26.2052 86.7316C-72.9994 195 129.606 466.711 377.559 381.487Z" fill="#35D1FA"/>
      </svg>
      <img src={allMembers}/>
    </div>
  </div>
)

const OurTeamsDiv = () => {
  const images = [
    <VscFeedback style={{ scale: "2", strokeWidth: "1" }} />,
    <FaHandshake style={{ scale: "2" }} />,
    <FaLaptopCode style={{ scale: "2" }} />,
    <HiSpeakerphone style={{ scale: "2" }} />,
    <BsFillCameraFill style={{ scale: "2" }} />,
    <MdEventNote style={{ scale: "2" }} />,
    <RiPenNibFill style={{ scale: "2", transform: "rotateZ(136deg)" }} />,
  ];

  return (
    <div className={style.teamsDiv}>
      <h2>As nossas equipas</h2>
      <div>
        {Object.entries(allTeamNames).map(([teamId, teamName], index) => (
          <CreateTeamButton
            key={index}
            teamId={teamId}
            teamName={teamName}
            icon={images[index]}
          />
        ))}
      </div>
    </div>
  );
};

const CreateTeamButton = ({ teamId, teamName, icon }) => {
  const [show, setShow] = React.useState(false);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  return (
    <>
      <CreateTeamModal
        teamId={teamId}
        teamName={teamName}
        icon={icon}
        show={show}
        handleClose={handleClose}
      />
      <Button onClick={handleShow}>
        {icon}
        <p style={{ margin: 0, fontWeight: "bold" }}>{teamName}</p>
      </Button>
    </>
  );
};

const CreateTeamModal = ({ teamId, teamName, icon, show, handleClose }) => (
  <Modal centered size="lg" show={show} onHide={handleClose}>
    <Modal.Header style={{ alignItems: "center", justifyContent: "center" }}>
      <Modal.Title
        style={{
          display: "flex",
          gap: "1em",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
        {teamName}
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>{TeamResume[teamId]}</Modal.Body>
  </Modal>
);

const DivPersonCard = ({ name, job, image }) => (
  <div className={style.cardContainer}>
    <PersonCard name={name} job={job} src={image}/>
  </div>
);

const PersonCard = ({ name, job, src }) => (
  <Card className={`${style.card}`}>
    <Card.Img className={`${style.cardImg} hover-zoom hover-shadow`} variant="top" src={src} />
    <Card.ImgOverlay className={style.cardImgOver}>
      <Card.Title bsPrefix={style.cardTitle}>{name}</Card.Title>
      {job && <Card.Text bsPrefix={style.cardText}>{job}</Card.Text>}
    </Card.ImgOverlay>
  </Card>
);

const TeamResume = {
  'CON': 'O trabalho na equipa de Contacto consiste em estabelecer e desenvolver relações com empresas, de modo a aproximá-las dos estudantes. Nisto está inserido: reunir com empresas para estabelecer os moldes de uma parceria,  angariação de patrocínios para eventos do NEIIST, planeamento de eventos em parceria com empresas, angariação de empresas para os IST Summer Internships, entre outros...',
  'CEQ': 'O trabalho no C&Q consiste na criação e partilha de formulários de forma a obter o feedback dos alunos em relação aos eventos organizados pelo NEIIST. No final de cada evento é elaborado um relatório para avaliar os resultados e para que os colaboradores saibam o que melhorar em eventos seguintes.',
  'DEV': 'A DEV-TEAM é a equipa de colaboradores do NEIIST que está responsável pelo site do núcleo, desde a sua manutenção até à implementação de novas funcionalidades. Os elementos da equipa trabalham tanto no backend como no frontend do site, de modo a melhorar as ferramentas disponíveis no site.',
  'DIV': 'O trabalho da equipa de Divulgação consiste na coordenação entre a divulgação de todos os eventos organizados pelo NEIIST e de alguns eventos que pedem ao núcleo para divulgar. Os membros desta equipa produzem o texto a seguir para cada evento, divulgando posteriormente pelas redes sociais (ex. Instagram, Facebook e/ou LinkedIn) e pelos grupos (ex. Discord, WhatsApp) de EIC, podendo adaptar-se ao tipo de evento e ao público alvo.',
  'FOT': 'O trabalho da equipa de Fotografia consiste na cobertura fotográfica e/ou videográfica de eventos organizados pelo NEIIST de modo a expandir a nossa galeria e a mostrar a todos os interessados o trabalho do núcleo. Os membros desta equipa fotografam e/ou filmam os eventos e depois editam o material para ficar pronto para publicação.',
  'ODE': 'A organização de eventos é algo diferente do trabalho nas restantes equipas, pode variar bastante de evento para evento, mas inclui sempre tratar da logística, falar com possíveis oradores e/ou outros intervenientes na organização do evento (talvez até falar com possíveis patrocinadores, se for esse o caso) e fazer a ponte com as outras equipas do NEIIST envolvidas no evento.',
  'VIS': 'O trabalho da equipa de Visuais consiste na criação de cartazes, banners, panfletos e outros materiais visuais para ajudar à divulgação de eventos organizados pelo NEIIST, para garantir que estes chegam ao maior número possível de alunos. Os membros da equipa produzem o material pedido e recebem feedback da equipa, antes de o enviar para os organizadores do evento que pedem as alterações necessárias, se for esse o caso.',
};

export default AboutPage;
