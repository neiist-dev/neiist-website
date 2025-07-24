import Image from "next/image";
import background from "@/assets/homepage/hero.png";
import styles from "@/styles/components/homepage/Hero.module.css";

const Hero = () => {
  return (
    <div className={styles.hero}>
      <div className={styles.backgroundImage}>
        <Image src={background} alt="Background Image" />
      </div>
      <div className={styles.initialBlur} />
      <div className={styles.titles}>
        <p>Núcleo Estudantil de Informática do Instituto Superior Técnico</p>
        <p>
          Um grupo de estudantes motivados para ajudar todo e qualquer aluno de Engenharia
          Informática e Computadores (e não só), realizando atividades no âmbito da informática e
          apoio social.
        </p>
      </div>
      <div className={styles.finalBlur} />
    </div>
  );
};

export default Hero;
