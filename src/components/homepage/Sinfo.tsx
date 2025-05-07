import Image from 'next/image';
import logo from '@/assets/sinfo.png';
import styles from '@/styles/components/homepage/Sinfo.module.css';

const Sinfo = () => {
  return (
    <div className={styles.sinfo}>
      <h1 className={styles.title}>Secção Autónoma</h1>
      <div className={styles.info}>
        <div className={styles.cta}>
          <Image src={logo} alt="SINFO" className={styles.logo}/>
          <br/>
          <a href="https://sinfo.org" target="_blank" rel="noopener noreferrer">
            <button className={styles.button}>Visita a SINFO!</button>
          </a>
        </div>
        <p className={styles.text}>
          A SINFO é um evento anual organizado exclusivamente por estudantes que se esforçam para tornar o
          evento mais interessante e inovador a cada edição. Todos os participantes têm o direito de
          experimentar alguns dos gadgets e tecnologias mais inovadoras do mercado para além de lhes ser
          apresentado uma visão geral do cenário de TI pelas melhores empresas do país. Para além disto tudo,
          todos os dias são realizados workshops nos temas mais requisitados e recentes, permitindo a todos
          os participantes que melhorem as suas skills técnicas e não-técnicas.
          <br/><br/>
          O principal objetivo da SINFO é permitir que todos os estudantes e os participantes em geral
          possam interagir e estar mais próximos de pessoas ou empresas influentes e interessantes no ramo
          das Tecnologias de Informação e Engenharia Informática.
        </p>
      </div>
    </div>
  );
};

export default Sinfo;
