import React,{useState, useEffect} from 'react';
import Card from 'react-bootstrap/Card';
import LoadSpinner from "../hooks/loadSpinner";

import style from './css/AboutPage.module.css'
import collabs from '../images/colaboradores/collaborators.json'
import { getCollabImage } from '../components/functions/collabsGeneral';
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
    <div className={style.header}>
      <h1>QUEM SOMOS</h1>
    </div>
    {Object.entries(collabs.orgaosSociais).map(([socialEntity, members], index)=>(
      <div key={index}>
        <h2>{socialEntity+' '+lectiveYear}</h2>
        <div className={style.socialOrgansDiv}>
          {Object.entries(members).map(([job, name], index) => (
            <DivPersonCard key={index} 
              name={name} job={normalizeJob(job)} image={getCollabImage(name)}/>
          ))}
        </div>
      </div>
    ))}
    {(collabs.Membros.length === 0 || !activeMembers) ?
    !activeMembersError && <LoadSpinner /> :
      <div>
        <h2>{`Membros Ativos ${lectiveYear}`}</h2>
        <div className={style.socialOrgansDiv}>
          {activeMembers.map( (member, index) => (
            <DivPersonCard key={index} name={member.name} image={getCollabImage(member.name)}/>
          ))}
        </div>
      </div>
    }
  </>
)};

const DivPersonCard = ({ name, job, image }) => (
  <div className={style.cardContainer}>
    <PersonCard name={name} job={job} src={image}/>
  </div>
);

const PersonCard = ({ name, job, src }) => (
  <Card className={style.card}>
    <Card.Img className={style.cardImg} variant="top" src={src} />
    <Card.Body>
      <Card.Title>{name}</Card.Title>
      {job && <Card.Text>{job}</Card.Text>}
    </Card.Body>
  </Card>
);

export default AboutPage;
