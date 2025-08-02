import Image from "next/image";
import heroAlameda from "@/assets/homepage/alameda.png";
import heroTaguspark from "@/assets/homepage/taguspark.png";
import styles from "@/styles/components/homepage/Hero.module.css";

const Hero = () => {
  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>
        Núcleo Estudantil de Informática do Instituto Superior Técnico
      </h1>
      <p className={styles.subtitle}>
        Um grupo de estudantes motivados para ajudar todo e qualquer aluno de Engenharia Informática
        e <br /> Computadores (e não só), realizando atividades no ambito da informática e apoio
        social.
      </p>
      <div className={styles.campusImages}>
        <div className={styles.alameda}>
          <Image
            src={heroAlameda}
            alt="Alameda View"
            fill
            priority
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className={styles.taguspark}>
          <Image
            src={heroTaguspark}
            alt="IST Building"
            fill
            priority
            style={{ objectFit: "cover" }}
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
