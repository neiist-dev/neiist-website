import React, { useState, useEffect, useContext, lazy } from 'react';
import Accordion from 'react-bootstrap/Accordion';

import UserDataContext from '../UserDataContext.js';
import style from './css/CollabsPage.module.css';

import { fenixPhoto, summarizeName } from "../components/functions/dataTreatment.jsx";
import {
  allTeamNames,
  filterTeamMembers,
  normalizeTeams,
  getCollabImage,
} from "../components/functions/collabsGeneral.jsx";
import { fetchAllCollabs, fetchCollabInformation } from '../Api.service.js';

const ManageCollabs = lazy(() => import("../components/collabs/ManageCollabs.jsx"));
const DivPersonCard = lazy(() => import("../components/collabs/CollabCard.jsx"));


const CollabsPage = () => {
  const { userData } = useContext(UserDataContext);
  const [selectedKey, setSelectedKey] = useState((userData.isCoordenator || userData.isAdmin ) ? 1 : 2);

  return (
    <div className={style.mainPage}>
      <CurrentCollabInfoPanel userData={userData} />
      <div className={style.teamsPainel}>
        <Accordion style={{ width: '100%', padding: '0' }} defaultActiveKey={(userData.isCoordenator || userData.isAdmin) ? '1' : '2'}>
          {userData.isCoordenator || userData.isAdmin &&
            <Accordion.Item onClick={() => { setSelectedKey(1) }} eventKey="1">
              <Accordion.Header><b>✨ Gerir Colaboradores</b></Accordion.Header>
              <Accordion.Body style={{ width: '100%', paddingLeft: '0', paddingRight: '0' }}>
                <ManageCollabs selectedKey={selectedKey} />
              </Accordion.Body>
            </Accordion.Item>
          }

          <Accordion.Item onClick={() => { setSelectedKey(2) }} eventKey="2">
            <Accordion.Header><b>My Team(s)</b></Accordion.Header>
            <Accordion.Body style={{ width: '100%', paddingLeft: '0', paddingRight: '0' }}>
              <CurrentTeams selectedKey={selectedKey} userData={userData} />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item onClick={() => { setSelectedKey(3) }} eventKey="3">
            <Accordion.Header><b>All Teams</b></Accordion.Header>
            <Accordion.Body style={{ width: '100%', paddingLeft: '0', paddingRight: '0' }}>
              <AllTeams selectedKey={selectedKey} />
            </Accordion.Body>
          </Accordion.Item>

        </Accordion>
      </div>
    </div>
  );
};

const CurrentCollabInfoPanel = ({ userData }) => (
  <>
    <div className={style.collabInformation}>
      <div
        className={style.memberImage}
        style={{ backgroundImage: `url(${fenixPhoto(userData.username)})` }}
      />
      <div className={style.nameEmailDiv}>
        <p><b>{summarizeName(userData.name)}</b></p>
        <p>{userData.email}</p>
      </div>
      <div className={style.memberStatusDiv}>
        <a href='/socios'><img src={`${process.env.PUBLIC_URL}/${userData.status}.svg`} /></a>
      </div>
    </div>

    <div className={style.discordDiv}>
      <iframe src={`${process.env.REACT_APP_DISCORD_LINK}`}
        width="100%" height="100%" allowtransparency="true"
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
      />
    </div>
  </>
);

const CurrentTeams = ({ selectedKey, userData }) => {
  const [currentTeamMembers, setCurrentTeamMembers] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (selectedKey == 2 && !currentTeamMembers) {
      fetchCollabInformation(userData.username)
        .then((res) => {
          userData.teams = (res.teams) ? res.teams : "";
          setCurrentTeamMembers(res.teamMembers);
        })
        .then(() => setIsLoaded(true));
    }
  }, [selectedKey]);

  return (
    <>
      {isLoaded &&
        normalizeTeams(userData.teams).map((team, index) => (
          <TeamSection
            key={index}
            teamName={team}
            teamMembers={filterTeamMembers(currentTeamMembers, team)}
          />
        ))}
    </>
  );
};

const AllTeams = ({ selectedKey }) => {
  const [allCollabs, setAllCollabs] = useState(null);

  useEffect(() => {
    if (selectedKey == 3 && !allCollabs) {
      fetchAllCollabs()
        .then((fetchAllCollabs) => {
          setAllCollabs(fetchAllCollabs);
        });
    }
  }, [selectedKey])

  return (
    <>
      {allCollabs &&
        Object.keys(allTeamNames).map((teamName, index) => (
          <TeamSection
            key={index}
            teamName={teamName}
            teamMembers={filterTeamMembers(allCollabs, teamName)}
          />
        ))
      }
    </>
  )
};

const TeamSection = ({ teamName, teamMembers }) => {
  const name = (member) => member.name ?
    summarizeName(member.name) : member.username;
  const image = (member) => getCollabImage(summarizeName(member.name),member.username);

  return (
    <div>
      <h3>{allTeamNames[teamName]} ({teamMembers.length})</h3>
      <div className={style.teamsDiv}>
        {teamMembers.map((member, index) => (
          <DivPersonCard
            key={index}
            name={name(member)}
            image={image(member)}

            teams={member.teams}
            selectedTeam={teamName}
          />
        ))}
      </div>
      <br />
    </div>
  );
}

export default CollabsPage;
