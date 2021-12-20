import React from 'react';
import Button from 'react-bootstrap/Button';
import sinfo from '../images/sinfo.png';

const SubgroupsPage = () => (
  <>
    <div style={{ margin: '2rem 20vw 1rem 20vw' }}>
      <h2 style={{ textAlign: 'center' }}>Semana Informática (SINFO)</h2>
      <p>
        A SINFO é um evento anual organizado exclusivamente por estudantes que
        se esforçam para tornar o evento mais interessante e inovador a cada
        edição. A SINFO Conf é um dos maiores eventos tecnológicos em Portugal,
        contando já com 27 edições. Durante uma semana, milhares de
        participantes reúnem-se para ver algumas das mentes mais brilhantes e
        melhores oradores do mundo falar sobre alguns dos temas mais actuais do
        mundo da tecnologia.
      </p>
      <p>
        Todos os participantes têm o direito de experimentar alguns dos gadgets
        e tecnologias mais inovadoras do mercado para além de lhes ser
        apresentado uma visão geral do cenário de TI pelas melhores empresas do
        país. Para além disto tudo, todos os dias são realizados workshops nos
        temas mais requisitados e recentes, permitindo a todos os participantes
        que melhorem as suas skills técnicas e não-técnicas.
      </p>
      <p>
        O principal objectivo da SINFO é permitir que todos os estudantes e os
        participantes em geral possam interagir e estar mais próximos de pessoas
        ou empresas influentes e interessantes no ramo das Tecnologias de
        Informação e Engenharia Informática.
      </p>
      <div style={{ textAlign: 'center' }}>
        <img style={{ width: '50%' }} src={sinfo} alt="" />
      </div>
    </div>

    <div style={{ margin: '1rem 20vw 2rem 20vw', textAlign: 'center' }}>
      <Button
        href="https://sinfo.org"
        target="_blank"
        rel="noreferrer"
      >
        VISITAR SITE
      </Button>
    </div>

  </>
);

export default SubgroupsPage;
