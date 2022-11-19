import React from 'react';
import alameda from '../images/alameda.jpg';
import taguspark from '../images/taguspark.jpg';

import style from './css/HomePage.module.css'

import useWindowSize from '../hooks/useWindowSize';

const HomePage = () => {
  const windowSize = useWindowSize();

  return (
    <>
    <div style={{margin: "0em 6em"}}>
      <div style={{height: '100vh'}}>
        <div style={{overflow: 'hidden', opacity: '75%', position: 'absolute', backgroundColor: '#000', width:'50%', height: '100vh', top: '-100px', left: '0px'}}>
          <img
            src={alameda}
            style={{width: '200%', height: '200%', objectFit: 'contains', objectPosition: 'calc( -375px + 50%) -125px'}}/>
        </div>
        <div style={{overflow: 'hidden', opacity: '75%', position: 'absolute', backgroundColor: '#adcff4', width:'50%', height: '100vh', top: '-100px', right: '0px'}}>
          <img
            src={taguspark}
            style={{width: '150%', height: '100%', objectFit: 'contains', objectPosition: 'calc( -250px + 20%) 200px'}}/>
        </div>
        <div style={{position: 'absolute', width: '150%', top: '-50%', left: '-25%', height: 'calc( 375px + 40% )', background: 'var(--bg-color)', borderRadius: '50% / 50% ', filter: 'blur(25px)'}}/>
        <div style={{position: 'relative', width: 'calc(100% - 12em)', height:'75vh', display: 'flex', flexWrap: 'nowrap',flexFlow: 'column nowrap', alignItems: 'center', justifyContent: 'flex-start', alignContent: 'center', flexDirection: 'column'}}>
          <h1>Núcleo Estudantil de Informática</h1>
          <h2>do Instituto Superior Técnico</h2>
          <p>Um grupo de estudantes motivados para ajudar todo e qualquer alun@ de Engenharia Informática e Computadores (e não só), realizando atividades no ambito da informática e apoio social.</p>
        </div>
      </div>
      <div className={style.row}>
        <div className={style.column}>
          <div style={{margin: "0em 3em 0em 0em"}}>
            <h1>Missão</h1>
              <div className={style.blueBox}>
                <div className={style.whiteBox}>
                  <p>
                  O NEIIST ambiciona ser o núcleo que integra, apoia e dinamiza todos os grupos, 
                  comunidades e iniciativas com 
                  impacto no percurso de estudantes do IST com interesses em Tecnologias de Informação.
                  </p>
                  <p>
                  Para tal, pretende criar uma plataforma que promova a cooperação entre estudantes, 
                  e entre estes e docentes, 
                  órgãos institucionais e empresas, centrada na criação de oportunidades e 
                  no associativismo e valorização pessoal.
                  </p>
                </div>
              </div>
            </div>
          </div>

        <div className={style.column}>
          <div style={{margin: "0em 0em 0em 3em"}}>
          <h1>Objetivos</h1>
          <div className={style.blueBox}>
            <div className={style.whiteBox}>
              <p>
                Organizar diversas atividades no âmbito da informática e valorização pessoal
              </p>
              <p>
                Estimular o interesse pela informática e a divulgação da mesma dentro e fora do Instituto Superior Técnico
              </p>
              <p>
                Contribuir para o relacionamento nacional e internacional dos estudantes de informática e de outras áreas afins
              </p>
              <p>
                Estimular o associativismo e o espírito de equipa dentro das licenciaturas da responsabilidade do DEI-IST
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>
      <div>
          <div style={{margin: "0em 0em 0em 0em"}}>
            <h1>Atividades</h1>
            <div className={style.blueBox}>
              <div className={style.whiteBox}>
                <div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;