import Image from "next/image";
import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaLinkedin,
  FaEnvelope,
  FaGithub,
} from "react-icons/fa";
import { SiLinktree } from "react-icons/si";
import styles from "@/styles/components/layout/Footer.module.css";

export default function Footer({ dict }: { dict?: any }) {
  const socialIcons = [
    {
      href: "https://facebook.com/NEIIST",
      icon: <FaFacebookF />,
      ariaLabel: "Facebook",
    },
    {
      href: "https://instagram.com/NEIIST",
      icon: <FaInstagram />,
      ariaLabel: "Instagram",
    },
    {
      href: "https://youtube.com/@neiist",
      icon: <FaYoutube />,
      ariaLabel: "YouTube",
    },
    {
      href: "https://www.linkedin.com/company/neiist/",
      icon: <FaLinkedin />,
      ariaLabel: "LinkedIn",
    },
    {
      href: "https://linktr.ee/NEIIST",
      icon: <SiLinktree />,
      ariaLabel: "Linktree",
    },
    {
      href: "mailto:neiist@tecnico.ulisboa.pt",
      icon: <FaEnvelope />,
      ariaLabel: "Email",
    },
    {
      href: "https://github.com/neiist-dev/neiist-website",
      icon: <FaGithub />,
      ariaLabel: "GitHub",
    },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.mission}>
          <h4>{dict?.title_neiist}</h4>
          <p>{dict?.mission_description}</p>
        </div>
        <div className={styles.section}>
          <h4>{dict?.about_title}</h4>
          <ul>
            <li>
              <Link className={styles.link} href="/about-us">
                {dict?.team_link}
              </Link>
            </li>
            <li>
              <Link
                className={styles.link}
                href="https://sinfo.org"
                target="_blank"
                rel="noopener noreferrer">
                SINFO
              </Link>
            </li>
            <li>
              <Link
                className={styles.link}
                href="/estatutos.pdf"
                target="_blank"
                rel="noopener noreferrer">
                {dict?.estatutos_link}
              </Link>
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h4>{dict?.courses_title}</h4>
          <ul>
            <li>
              <Link
                className={styles.link}
                href="https://fenix.tecnico.ulisboa.pt/cursos/leic-a"
                target="_blank"
                rel="noopener noreferrer">
                LEIC-A
              </Link>
              {" / "}
              <Link
                className={styles.link}
                href="https://fenix.tecnico.ulisboa.pt/cursos/leic-t"
                target="_blank"
                rel="noopener noreferrer">
                LEIC-T
              </Link>
            </li>
            <li>
              <Link
                className={styles.link}
                href="https://fenix.tecnico.ulisboa.pt/cursos/meic-a"
                target="_blank"
                rel="noopener noreferrer">
                MEIC-A
              </Link>
              {" / "}
              <Link
                className={styles.link}
                href="https://fenix.tecnico.ulisboa.pt/cursos/meic-t"
                target="_blank"
                rel="noopener noreferrer">
                MEIC-T
              </Link>
            </li>
            <li>
              <Link
                className={styles.link}
                href="https://fenix.tecnico.ulisboa.pt/cursos/deic"
                target="_blank"
                rel="noopener noreferrer">
                DEIC
              </Link>
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h4>{dict?.contacts_title}</h4>
          <ul>
            <li>
              ✉️{" "}
              <Link className={styles.link} href="mailto:neiist@tecnico.ulisboa.pt">
                neiist@tecnico.ulisboa.pt
              </Link>
            </li>
            <li>
              <address>
                📬 NEIIST (Núcleo Estudantil de Informática do IST)
                <br />
                Instituto Superior Técnico
                <br />
                {dict.address}
              </address>
            </li>
          </ul>
        </div>
        <div className={styles.section}>
          <h4>{dict?.powered_by}</h4>
          <Link
            href="https://dei.tecnico.ulisboa.pt"
            target="_blank"
            rel="noopener noreferrer"
            style={{ paddingLeft: "10px" }}>
            <Image src="/DEI.svg" alt="DEI Logo" width={200} height={100} />
          </Link>
        </div>
      </div>

      <div className={styles.bottom}>
        <p className={styles.copyright}>{dict?.copyright}</p>
        <div className={styles.socialIcons}>
          {socialIcons.map(({ href, icon, ariaLabel }, index) => (
            <Link
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={ariaLabel}
              className={styles.socialIcon}>
              {icon}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
