import React,{useState, useEffect} from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button'
import LoadSpinner from "../hooks/loadSpinner";

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

import style from './css/AboutPage.module.css'
import collabs from '../images/colaboradores/collaborators.json'
import { normalizeJob } from '../components/functions/dataTreatment'

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
    <VscFeedback style={{scale: '2', fill: 'white'}}/>,
    <FaHandshake style={{scale: '2'}}/>,
    <FaLaptopCode style={{scale: '2'}}/>,
    <HiSpeakerphone style={{scale: '2'}}/>,
    <BsFillCameraFill style={{scale: '2'}}/>,
    <MdEventNote style={{scale: '2'}}/>,
    <RiPenNibFill style={{scale: '2', transform: 'rotateZ(136deg)'}}/>,
  ]

  return (
    <div className={style.teamsDiv}>
      <h2>As nossas equipas</h2>
      <div>
        {Object.values(allTeamNames).map((teamName, index) => (
          <Button key={index}>
            {images[index]}
            <p style={{margin: 0, fontWeight: 'bold'}}>
              {teamName}
            </p>
          </Button>
        ))}
      </div>
    </div>
  )
}

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

export default AboutPage;
