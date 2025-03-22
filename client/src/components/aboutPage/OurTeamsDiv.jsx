import { BsFillCameraFill } from 'react-icons/bs';
import { FaLaptopCode, FaHandshake } from 'react-icons/fa';
import { RiPenNibFill } from 'react-icons/ri';
import { HiSpeakerphone } from 'react-icons/hi';
import { MdEventNote } from 'react-icons/md';
import { VscFeedback } from 'react-icons/vsc';

import React,{ lazy } from 'react';
import { Button } from 'react-bootstrap';

import { allTeamNames } from '../functions/collabsGeneral.jsx';
import style from '../../pages/css/AboutPage.module.css'

const CreateTeamModal = lazy(() => import('./TeamModal'));

const icons = [
  <VscFeedback style={{ strokeWidth: '1' }} />,
  <FaHandshake />,
  <FaLaptopCode />,
  <HiSpeakerphone />,
  <BsFillCameraFill />,
  <MdEventNote />,
  <RiPenNibFill style={{ transform: 'rotateZ(136deg)' }} />,
];

const OurTeamsDiv = ({ activeMembers }) => (
  <div className={style.teamsDiv}>
    <h2>As nossas equipas</h2>
    <div>
      {Object.entries(allTeamNames).map(([teamId, teamName], index) => (
        <CreateTeamButton
          key={index}
          teamId={teamId}
          teamName={teamName}
          icon={icons[index]}
          activeMembers={activeMembers}
        />
      ))}
    </div>
  </div>
);

const CreateTeamButton = ({ teamId, teamName, icon, activeMembers }) => {
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
        activeMembers={activeMembers}
      />
      <Button onClick={handleShow}>
        {icon}
        <p>{teamName}</p>
      </Button>
    </>
  );
};

export default OurTeamsDiv;