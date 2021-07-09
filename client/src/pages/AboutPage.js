import React from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import AndrePatricio2 from "../images/colaboradores/AndrePatricio2.jpg";
import AndreSilva from "../images/colaboradores/AndreSilva.jpg";
import BernardoNunes from "../images/colaboradores/BernardoNunes.jpg";
import CatarinaGoncalves from "../images/colaboradores/CatarinaGoncalves.jpeg";
import FranciscoCasaca from "../images/colaboradores/FranciscoCasaca.jpg";
import HenriqueFerreira from "../images/colaboradores/HenriqueFerreira.jpg";
import JoaoSanches from "../images/colaboradores/JoaoSanches.jpg";
import ManuelFigueiroa from "../images/colaboradores/ManuelFigueiroa.jpg";
import MarianaFerreira from "../images/colaboradores/MarianaFerreira.jpg";
import MiguelGoncalves from "../images/colaboradores/MiguelGoncalves.jpg";
import MiguelRegouga from "../images/colaboradores/MiguelRegouga.jpg";
import RafaelGalhoz from "../images/colaboradores/RafaelGalhoz.jpg";
import RodrigoCosta from "../images/colaboradores/RodrigoCosta.jpg";
import RodrigoMajor from "../images/colaboradores/RodrigoMajor.jpg";
import VascoPereira from "../images/colaboradores/VascoPereira.jpg";

const AboutPage = () => (
  <>
    <div style={{ margin: "2rem 20vw 1rem 20vw" }}>
      <h1 style={{ textAlign: "center" }}>QUEM SOMOS</h1>
    </div>

    <h2 style={{ textAlign: "center" }}>DIREÇÃO 2020/2021</h2>
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignContent: "space-around",
        flexWrap: "wrap",
        padding: "0 10px 10px 10px",
        margin: "1rem 10vw"
      }}
    >
      <PersonCard name="André Patrício" role="Presidente" src={AndrePatricio2} />
      <PersonCard name="Manuel Figueiroa" role="Vice-Presidente" src={ManuelFigueiroa} />
      <PersonCard name="Henrique Ferreira" role="Diretor de Atividades (Alameda)" src={HenriqueFerreira} />
      <PersonCard name="Miguel Gonçalves" role="Diretor de Atividades (Taguspark)" src={MiguelGoncalves} />
      <PersonCard name="André Silva" role="Vogal" src={AndreSilva} />
      <PersonCard name="João Sanches" role="Tesoureiro" src={JoaoSanches} />
      <PersonCard name="Miguel Regouga" role="Diretor SINFO" src={MiguelRegouga} />
    </div>

    <h2 style={{ textAlign: "center" }}>MESA DA ASSEMBLEIA GERAL 2020/2021</h2>
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignContent: "space-around",
        flexWrap: "wrap",
        padding: "0 10px 10px 10px",
        margin: "1rem 10vw"
      }}
    >
      <PersonCard name="Catarina Gonçalves" role="Presidente" src={CatarinaGoncalves} />
      <PersonCard name="Mariana Ferreira" role="Vice-Presidente" src={MarianaFerreira} />
      <PersonCard name="Vasco Pereira" role="Secretário" src={VascoPereira} />
      <PersonCard name="Bernardo Nunes" role="Secretário" src={BernardoNunes} />
    </div>

    <h2 style={{ textAlign: "center" }}>CONCELHO FISCAL 2020/2021</h2>
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignContent: "space-around",
        flexWrap: "wrap",
        padding: "0 10px 10px 10px",
        margin: "1rem 20vw 2rem 20vw"
      }}
    >
      <PersonCard name="Rafael Galhoz" role="Presidente" src={RafaelGalhoz} />
      <PersonCard name="Rodrigo Costa" role="Membro" src={RodrigoCosta} />
      <PersonCard name="Rodrigo Major" role="Membro" src={RodrigoMajor} />
    </div>
  </>
);

const PersonCard = ({ name, role, src }) =>
  <Card style={{ margin: "10px", width: "15rem", textAlign: "center" }} >
    <Card.Img variant="top" src={src} />
    <Card.Body>
      <Card.Title>{name}</Card.Title>
      <Card.Text>{role}</Card.Text>
    </Card.Body>
  </Card>

export default AboutPage;
