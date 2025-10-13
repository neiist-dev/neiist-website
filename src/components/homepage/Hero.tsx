import Image from "next/image";
import heroIST from "@/assets/homepage/istHero.png";
import styles from "@/styles/components/homepage/Hero.module.css";

const Hero = () => {
  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>
        Núcleo Estudantil de
        <span className={styles.primary}> In</span>
        <span className={styles.secondary}>for</span>
        <span className={styles.tertiary}>mát</span>
        <span className={styles.quaternary}>ica </span>
        do Instituto Superior Técnico
      </h1>
      <div className={styles.campusImages}>
        <Image src={heroIST} alt="Campus Views" fill priority />
      </div>
    </section>
  );
};

export default Hero;
