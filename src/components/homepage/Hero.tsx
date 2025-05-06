import Image from "next/image";
import background from "@/assets/background.png";
import style from "@/styles/components/homepage/Hero.module.css";

const Hero = () => {
  return (
    <div className={style.hero}>
      <div className={style.backgroundImage}>
        <Image src={background} alt="Background Image"/>
      </div>
      <div className={style.initialBlur} />
      <div className={style.titles}>
        <p>Núcleo Estudantil de Informática do Instituto Superior Técnico</p>
        <p>
          Um grupo de estudantes motivados para ajudar todo e qualquer aluno de
          Engenharia Informática e Computadores (e não só), realizando
          atividades no âmbito da informática e apoio social.
        </p>
      </div>
      <div className={style.finalBlur} />
    </div>
  );
};

export default Hero;
