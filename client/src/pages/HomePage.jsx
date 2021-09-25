import React from 'react';
import Carousel from 'react-bootstrap/Carousel';

import neiistBanner from '../images/neiist_banner.jpg';
import alameda from '../images/alameda.jpg';
import taguspark from '../images/taguspark.jpg';

import useWindowSize from '../hooks/useWindowSize';

const HomePage = () => {
  const windowSize = useWindowSize();

  return(
    <>
      <div style={{ margin: '2rem 20vw 1rem 20vw' }}>
        <Carousel>
          <Carousel.Item>
            <img
              style={{
                display: 'block',
                width: '100%',
                height: '70vh',
                objectFit: 'cover',
              }}
              src={neiistBanner}
              alt="neiistBanner"
            />
          </Carousel.Item>
          <Carousel.Item>
            <img
              style={{
                display: 'block',
                width: '100%',
                height: '70vh',
                objectFit: 'cover',
              }}
              src={alameda}
              alt="alameda"
            />
          </Carousel.Item>
          <Carousel.Item>
            <img
              style={{
                display: 'block',
                width: '100%',
                height: '70vh',
                objectFit: 'cover',
              }}
              src={taguspark}
              alt="taguspark"
            />
          </Carousel.Item>
        </Carousel>
      </div>

      <div style={{ margin: '1rem 20vw' }}>
        <h1 style={{ textAlign: 'center' }}>MISSÃO</h1>
        <p>
          O NEIIST ambiciona ser o núcleo que integra, apoia e dinamiza todos os
          grupos, comunidades e iniciativas com impacto no percurso de estudantes
          do IST com interesses em Tecnologias de Informação.
        </p>
        <p>
          Para tal, pretende criar uma plataforma que promova a cooperação entre
          estudantes, e entre estes e docentes, órgãos institucionais e empresas,
          centrada na criação de oportunidades e no associativismo e valorização
          pessoal.
        </p>
      </div>

      <div style={{ margin: '1rem 20vw' }}>
        <h1 style={{ textAlign: 'center' }}>OBJETIVOS</h1>
        <ul>
          <li>Organizar diversas Atividades no âmbito da informática e valorização pessoal</li>
          <li>
            Estimular o interesse pela informática
            e a divulgação da mesma dentro e fora do Instituto Superior Técnico
          </li>
          <li>
            Contribuir para o relacionamento nacional e internacional
            dos estudantes de informática e de outras áreas afins
          </li>
          <li>
            Estimular o associativismo e o espírito de equipa
            dentro das licenciaturas da responsabilidade do
            Departamento de Engenharia Informática do Instituto Superior Técnico (DEI)
          </li>
          <li>
            Promover a imagem das licenciaturas, mestrados e doutoramentos
            da responsabilidade do DEI
          </li>
          <li>
            Promover o relacionamento entre
            professores, alunos, profissionais do ramo e empresas
          </li>
        </ul>
      </div>

      <div style={{ margin: '1rem 20vw' }}>
        <h1 style={{ textAlign: 'center' }}>NOVIDADES</h1>
      </div>

      <div style={{ textAlign: 'center', padding: '0rem 0rem 2rem 0rem' }}>
        <iframe
          title="Facebook do NEIIST"
          src={
             windowSize.innerWidth < 600 ? 
             "https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FNEIIST&tabs=timeline&width=300&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId" 
             : 
             "https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FNEIIST&tabs=timeline&width=500&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId" 
          }
          width={ windowSize.innerWidth < 600 ? 300 : 500 }
          height="500"
          style={{ border: 'none' }}
        />
      </div>

    </>
  );
};

export default HomePage;
