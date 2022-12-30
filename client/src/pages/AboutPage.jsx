import React from 'react';
import Card from 'react-bootstrap/Card';

import style from './css/AboutPage.module.css'
import collabs from '../images/colaboradores/collaborators.json'
import { getImage } from '../components/functions/collabsGeneral';

const lectiveYear = collabs.anoLetivo;

const normalizeJob = (job) => (job.replace(/[0-9]{1,}/g, ""));

export const normalizeName = (name) => (removeAccent(name).replace(" ", ""));

const removeAccent = (name) =>
  (name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

const AboutPage = () => (
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
              name={name} job={normalizeJob(job)} image={getImage(name)}/>
          ))}
        </div>
      </div>
    ))}
    {collabs.Membros.length !== 0 &&
      <div>
        <h2>{'Membros Ativos '+lectiveYear}</h2>
        <div className={style.socialOrgansDiv}>
          {Object.values(collabs["Membros"]).map((name, index)=> (
            <DivPersonCard key={index} name={name} image={getImage(name)}/>
          ))}
        </div>
      </div>
    }
  </>
);

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
