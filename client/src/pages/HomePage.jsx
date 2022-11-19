import React from 'react';
import alameda from '../images/alameda.jpg';
import taguspark from '../images/taguspark.jpg';
import esports from '../images/eventos/esports.jpg';
import sweats from '../images/eventos/sweats.png';
import python from '../images/eventos/python.jpg';
import qtsm from '../images/eventos/qtsm.jpg';
import sinfo from '../images/sinfo.png';

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
        <div style={{position: 'relative', height:'75vh', display: 'flex', flexWrap: 'nowrap', flexFlow: 'column nowrap', alignItems: 'center', justifyContent: 'flex-start', alignContent: 'center', flexDirection: 'column'}}>
          <h1>Núcleo Estudantil de Informática</h1>
          <h1>do Instituto Superior Técnico</h1>
          <p style={{fontSize: "1.5em", width: "60%", textAlign: "center", marginBottom: "0"}}>
            Um grupo de estudantes motivados para ajudar todo e qualquer 
          </p>
          <p style={{fontSize: "1.5em", width: "60%", textAlign: "center", marginBottom: "0"}}>
            aluno de Engenharia Informática e Computadores (e não só), 
          </p>
          <p style={{fontSize: "1.5em", width: "60%", textAlign: "center", marginBottom: "0"}}>
            realizando atividades no ambito da informática e apoio social.
          </p>
        </div>
      </div>
      <div className={style.row}>
        <div className={style.column}>
          <div style={{margin: "0em 3em 0em 0em"}}>
            <h1 style={{textAlign: "left"}}>Missão</h1>
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
          <h1 style={{textAlign: "left"}}>Objetivos</h1>
          <div className={style.blueBox}>
            <div className={style.whiteBox}>
              <p style={{color:"white", backgroundColor: "darkblue", borderRadius: "0.5em", padding: "0.5em"}}>
                Organizar diversas atividades no âmbito da informática e valorização pessoal
              </p>
              <p style={{color:"white", backgroundColor: "#248BE3", borderRadius: "0.5em", padding: "0.5em"}}>
                Estimular o interesse pela informática e a divulgação da mesma dentro e fora do Instituto Superior Técnico
              </p>
              <p style={{color:"white", backgroundColor: "darkblue", borderRadius: "0.5em", padding: "0.5em"}}>
                Contribuir para o relacionamento nacional e internacional dos estudantes de informática e de outras áreas afins
              </p>
              <p style={{color:"white", backgroundColor: "#248BE3", borderRadius: "0.5em", padding: "0.5em"}}>
                Estimular o associativismo e o espírito de equipa dentro das licenciaturas da responsabilidade do DEI-IST
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>
      <div>
          <div style={{margin: "0em 0em 0em 0em"}}>
            <h1 style={{textAlign: "left"}}>Atividades</h1>
            <div className={style.blueBox}>
              <div className={style.whiteBox}>
                <div className={style.row}>
                  <div className={style.column} style={{margin: "1em"}}>
                    <img src={python} className={style.activityImage}/>
                    <div className={style.activityText}> Workshops </div>
                  </div>
                  <div className={style.column} style={{margin: "1em"}}>
                    <img src={sweats} className={style.activityImage}/>
                    <div className={style.activityText}> Sweats EIC </div>
                  </div>
                  <div className={style.column} style={{margin: "1em"}}>
                    <img src={esports} className={style.activityImage}/>
                    <div className={style.activityText}> Torneio de E-Sports </div>
                  </div>
                  <div className={style.column} style={{margin: "1em"}}>
                    <img src={qtsm} className={style.activityImage}/>
                    <div className={style.activityText}> Quase Tudo Sobre MEIC </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{margin: "0em 3em 0em 0em"}}>
          <h1 style={{textAlign: "left"}}>Secção Autónoma</h1>
            <div className={style.blueBox}>
              <div className={style.whiteBox}>
                <div className={style.row}>
                  <div className={style.column} style={{margin: "1em", verticalAlign: "middle"}}>
                    <img src={sinfo} style={{width: "25em"}}/>
                    <br/>
                    <button className={style.sinfoButton}> Visita a SINFO! </button>
                  </div>
                  <div className={style.column} style={{margin: "1em", alignContent: "center"}}>
                    <p>
                      A SINFO é um evento anual organizado exclusivamente por estudantes que se esforçam para tornar o 
                      evento mais interessante e inovador a cada edição. Todos os participantes têm o direito de 
                      experimentar alguns dos gadgets e tecnologias mais inovadoras do mercado para além de lhes ser 
                      apresentado uma visão geral do cenário de TI pelas melhores empresas do país. Para além disto tudo, 
                      todos os dias são realizados workshops nos temas mais requisitados e recentes, permitindo a todos 
                      os participantes que melhorem as suas skills técnicas e não-técnicas.
                    </p>
                    <p>
                      O principal objectivo da SINFO é permitir que todos os estudantes e os participantes em geral
                      possam interagir e estar mais próximos de pessoas ou empresas influentes e interessantes no ramo 
                      das Tecnologias de Informação e Engenharia Informática.
                    </p>
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