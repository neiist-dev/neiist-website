import { FaFacebookF, FaInstagram, FaLinkedin, FaEnvelope, FaGithub } from "react-icons/fa";
import { SiLinktree } from "react-icons/si";
import styles from "@/styles/components/Footer.module.css";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          {/* About NEIIST */}
          <div className={styles.section}>
            <h6>NEIIST</h6>
            <p>
            Um grupo de estudantes motivados para ajudar todo e qualquer aluno de Engenharia Informática e Computadores (e não só), realizando atividades no ambito da informática e apoio social.
            </p>
          </div>

          {/* Site Pages */}
            <div className={styles.section}>
            <h6>Sobre o Núcleo</h6>
            <ul>
              <li><a href="/equipa">Equipa</a></li>
              <li><a href="/estudante">Estudante</a></li>
              <li><a href="/estatutos.pdf" target="_blank" rel="noopener noreferrer">Estatutos</a></li>
            </ul>
            </div>

          {/* Cursos EIC */}
          <div className={styles.section}>
            <h6>Cursos de EIC</h6>
            <ul>
              <li>
                <a href="https://fenix.tecnico.ulisboa.pt/cursos/leic-a" target="_blank" rel="noopener noreferrer">
                  LEIC-A
                </a> /
                <a href="https://fenix.tecnico.ulisboa.pt/cursos/leic-t" target="_blank" rel="noopener noreferrer">
                  LEIC-T
                </a>
              </li>
              <li>
                <a href="https://fenix.tecnico.ulisboa.pt/cursos/meic-a" target="_blank" rel="noopener noreferrer">
                  MEIC-A
                </a> / 
                <a href="https://fenix.tecnico.ulisboa.pt/cursos/meic-t" target="_blank" rel="noopener noreferrer">
                  MEIC-T
                </a>
              </li>
              <li>
                <a href="https://fenix.tecnico.ulisboa.pt/cursos/deic" target="_blank" rel="noopener noreferrer">
                  DEIC
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className={styles.section}>
            <h6>Contactos</h6>
            <p>✉️ <a href="mailto:neiist@tecnico.ulisboa.pt">neiist@tecnico.ulisboa.pt</a></p>
            <p>
              📬 NEIIST (Núcleo Estudantil de Informática do IST)
              <br/>
              Instituto Superior Técnico
              <br/>
              Av. Rovisco Pais 1, 1049-001 Lisboa
            </p>
          </div>

          {/* Powered By */}
          <div className={styles.section}>
            <h6>Powered by:</h6>
            <a href="https://dei.tecnico.ulisboa.pt" target="_blank" rel="noopener noreferrer" style={{ paddingLeft: "10px" }}>
              <Image src="/dei.svg" alt="DEI Logo" className={styles.deiLogo} width={200} height={100} />
            </a>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className={styles.footerBottom}>
          <p>© 2025 NEIIST. All rights reserved.</p>
          {/* Social Icons */}
          <div className={styles.socialIcons}>
            <a href="https://facebook.com/NEIIST" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="https://instagram.com/NEIIST" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://www.linkedin.com/company/neiist/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FaLinkedin />
            </a>
            <a href="https://linktr.ee/NEIIST" target="_blank" rel="noopener noreferrer" aria-label="Linktree">
              <SiLinktree />
            </a>
            <a href="mailto:neiist@tecnico.ulisboa.pt" target="_blank" rel="noopener noreferrer" aria-label="Email">
              <FaEnvelope />
            </a>
            <a href="https://github.com/neiist-dev/neiist-website" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <FaGithub />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
