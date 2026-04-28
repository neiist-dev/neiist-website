import Image from "next/image";
import logo from "@/assets/homepage/sinfo.png";
import styles from "@/styles/components/homepage/Sinfo.module.css";

const Sinfo = ({ dict }: { dict: { title: string; button: string; description: string; objective: string }}) => {

  return (
    <div className={styles.sinfo}>
      <h1 className={styles.title}>{dict.title}</h1>
      <div className={styles.info}>
        <div className={styles.cta}>
          <Image src={logo} alt="SINFO" className={styles.logo} />
          <br />
          <a href="https://sinfo.org" target="_blank" rel="noopener noreferrer">
            <button className={styles.button}>{dict.button}</button>
          </a>
        </div>
        <p className={styles.text}>
          {dict.description}
          <br />
          <br />
          {dict.objective}
        </p>
      </div>
    </div>
  );
};

export default Sinfo;
