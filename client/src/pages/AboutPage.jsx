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
