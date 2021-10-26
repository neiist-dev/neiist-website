import React from 'react';
import Card from 'react-bootstrap/Card';

import AndreSilva from '../images/colaboradores/AndreSilva.jpg';
import BeatrizAlves from '../images/colaboradores/BeatrizAlves.jpg';
import BernardoNunes from '../images/colaboradores/BernardoNunes.jpg';
import CatarinaGoncalves from '../images/colaboradores/CatarinaGoncalves.jpeg';
import CatarinaSousa from '../images/colaboradores/CatarinaSousa.jpg';
import JoaoPina from '../images/colaboradores/JoaoPina.jpg';
import LeonorVeloso from '../images/colaboradores/LeonorVeloso.jpg';
import MarianaCintrao from '../images/colaboradores/MarianaCintrao.jpg';
import MariaRibeiro from '../images/colaboradores/MariaRibeiro.jpg';
import MiguelGoncalves from '../images/colaboradores/MiguelGoncalves.jpg';
import NelsonTrindade from '../images/colaboradores/NelsonTrindade.jpg';
import NunoSerras from '../images/colaboradores/NunoSerras.jpeg';
import PedroFernandes from '../images/colaboradores/PedroFernandes.jpg';
import RodrigoMajor from '../images/colaboradores/RodrigoMajor.jpg';

const AboutPage = () => (
  <>
    <div style={{ margin: '2rem 20vw 1rem 20vw' }}>
      <h1 style={{ textAlign: 'center' }}>QUEM SOMOS</h1>
    </div>

    <h2 style={{ textAlign: 'center' }}>DIREÇÃO 2021/2022</h2>
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'space-around',
        flexWrap: 'wrap',
        padding: '0 10px 10px 10px',
        margin: '1rem 10vw',
      }}
    >
      <PersonCard name="André Silva" job="Presidente" src={AndreSilva} />
      <PersonCard name="Miguel Gonçalves" job="Vice-Presidente" src={MiguelGoncalves} />
      <PersonCard name="Catarina Sousa" job="Vogal" src={CatarinaSousa} />
      <PersonCard name="Catarina Gonçalves" job="Diretor de Atividades (Alameda)" src={CatarinaGoncalves} />
      <PersonCard name="Nelson Trindade" job="Diretor de Atividades (Taguspark)" src={NelsonTrindade} />
      <PersonCard name="Mariana Cintrão" job="Diretor SINFO" src={MarianaCintrao} />
      <PersonCard name="João Pina" job="Tesoureiro" src={JoaoPina} />
    </div>

    <h2 style={{ textAlign: 'center' }}>MESA DA ASSEMBLEIA GERAL 2021/2022</h2>
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'space-around',
        flexWrap: 'wrap',
        padding: '0 10px 10px 10px',
        margin: '1rem 10vw',
      }}
    >
      <PersonCard name="Maria Ribeiro" job="Presidente" src={MariaRibeiro} />
      <PersonCard name="Rodrigo Major" job="Vice-Presidente" src={RodrigoMajor} />
      <PersonCard name="Beatriz Alves" job="Secretário" src={BeatrizAlves} />
      <PersonCard name="Bernardo Nunes" job="Secretário" src={BernardoNunes} />
    </div>

    <h2 style={{ textAlign: 'center' }}>CONSELHO FISCAL 2021/2022</h2>
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'space-around',
        flexWrap: 'wrap',
        padding: '0 10px 10px 10px',
        margin: '1rem 20vw 2rem 20vw',
      }}
    >
      <PersonCard name="Pedro Fernandes" job="Presidente" src={PedroFernandes} />
      <PersonCard name="Leonor Veloso" job="Membro" src={LeonorVeloso} />
      <PersonCard name="Nuno Serras" job="Membro" src={NunoSerras} />
    </div>
  </>
);

const PersonCard = ({ name, job, src }) => (
  <Card style={{ margin: '10px', width: '15rem', textAlign: 'center' }}>
    <Card.Img variant="top" src={src} />
    <Card.Body>
      <Card.Title>{name}</Card.Title>
      <Card.Text>{job}</Card.Text>
    </Card.Body>
  </Card>
);

export default AboutPage;
