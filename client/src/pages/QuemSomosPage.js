import React from 'react'
import Button from 'react-bootstrap/Button'
import AndrePatricio2 from '../images/colaboradores/AndrePatricio2.jpg'
import AndreSilva from '../images/colaboradores/AndreSilva.jpg'
import BernardoNunes from '../images/colaboradores/BernardoNunes.jpg'
import CatarinaGoncalves from '../images/colaboradores/CatarinaGoncalves.jpeg'
import FranciscoCasaca from '../images/colaboradores/FranciscoCasaca.jpg'
import HenriqueFerreira from '../images/colaboradores/HenriqueFerreira.jpg'
import JoaoSanches from '../images/colaboradores/JoaoSanches.jpg'
import ManuelFigueiroa from '../images/colaboradores/ManuelFigueiroa.jpg'
import MarianaFerreira from '../images/colaboradores/MarianaFerreira.jpg'
import MiguelGoncalves from '../images/colaboradores/MiguelGoncalves.jpg'
import MiguelRegouga from '../images/colaboradores/MiguelRegouga.jpg'
import RafaelGalhoz from '../images/colaboradores/RafaelGalhoz.jpg'
import RodrigoCosta from '../images/colaboradores/RodrigoCosta.jpg'
import RodrigoMajor from '../images/colaboradores/RodrigoMajor.jpg'
import VascoPereira from '../images/colaboradores/VascoPereira.jpg'

const QuemSomos = () =>
    <>
        <div style={{ margin: "10px 20vw" }}>
            <h1 style={{ textAlign: "center" }}>
                QUEM SOMOS
            </h1>
        </div>
        <div style={{ margin: "10px 20vw" }}>
            <h2 style={{ textAlign: "center" }}>
                DIREÇÃO 2020/2021
            </h2>
            <img
                style={{ display: "block", width: "100%" }}
                src={AndrePatricio2}
            />
            <p>André Patrício</p>
            <p>Presidente</p>
            <img
                style={{ display: "block", width: "100%" }}
                src={ManuelFigueiroa}
            />
            <p>Manuel Figueiroa</p>
            <p>Vice-Presidente</p>
            <img
                style={{ display: "block", width: "100%" }}
                src={HenriqueFerreira}
            />
            <p>Henrique Ferreira</p>
            <p>Diretor de Atividades (Alameda)</p>
            <img
                style={{ display: "block", width: "100%" }}
                src={MiguelGoncalves}
            />
            <p>Miguel Gonçalves</p>
            <p>Diretor de Atividades (Taguspark)</p>
            <img
                style={{ display: "block", width: "100%" }}
                src={AndreSilva}
            />
            <p>André Silva</p>
            <p>Vogal</p>
            <img
                style={{ display: "block", width: "100%" }}
                src={JoaoSanches}
            />
            <p>João Sanches</p>
            <p>Tesoureiro</p>
            <img
                style={{ display: "block", width: "100%" }}
                src={MiguelRegouga}
            />
            <p>Miguel Regouga</p>
            <p>Diretor SINFO</p>
        </div>
        <div style={{ margin: "10px 20vw" }}>
            <h2 style={{ textAlign: "center" }}>
                MESA DA ASSEMBLEIA GERAL 2020/2021
            </h2>
            <img
                style={{ display: "block", width: "100%" }}
                src={CatarinaGoncalves}
            />
            <p>Catarina Gonçalves</p>
            <p>Presidente</p>
            <img
                style={{ display: "block", width: "100%" }}
                src={MarianaFerreira}
            />
            <p>Mariana Ferreira</p>
            <p>Vice-Presidente</p>
            <img
                style={{ display: "block", width: "100%" }}
                src={VascoPereira}
            />
            <p>Vasco Pereira</p>
            <p>Secretário</p>
            <img
                style={{ display: "block", width: "100%" }}
                src={BernardoNunes}
            />
            <p>Bernardo Nunes</p>
            <p>Secretário</p>
        </div>
        <div style={{ margin: "10px 20vw" }}>
            <h2 style={{ textAlign: "center" }}>
                CONCELHO FISCAL 2020/2021
            </h2>
            <img
                style={{ display: "block", width: "100%" }}
                src={RafaelGalhoz}
            />
            <p>Rafael Galhoz</p>
            <p>Presidente</p>
            <img
                style={{ display: "block", width: "100%" }}
                src={RodrigoCosta}
            />
            <p>Rodrigo Costa</p>
            <p>Membro</p>
            <img
                style={{ display: "block", width: "100%" }}
                src={RodrigoMajor}
            />
            <p>Rodrigo Major</p>
            <p>Membro</p>
        </div>
    </>

export default QuemSomos