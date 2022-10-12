import React from 'react';
import { Link } from 'react-router-dom';

import style from './css/Footer.module.css';
//SVG's by https://iconmonstr.com/

const Footer = () => (
  <footer>
    <SocialIcons />
    <Links />
  </footer>
);

const SocialIcons = () => (
  <div className={style.links}>
    <div className={style.linkIconSpace}>
      <div>
        <a href='https://facebook.com/NEIIST' target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692h1.971v3z" /></svg>
        </a>
      </div>
      <div>
        <a href='https://instagram.com/NEIIST' target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24"><path d="M14.829 6.302c-.738-.034-.96-.04-2.829-.04s-2.09.007-2.828.04c-1.899.087-2.783.986-2.87 2.87-.033.738-.041.959-.041 2.828s.008 2.09.041 2.829c.087 1.879.967 2.783 2.87 2.87.737.033.959.041 2.828.041 1.87 0 2.091-.007 2.829-.041 1.899-.086 2.782-.988 2.87-2.87.033-.738.04-.96.04-2.829s-.007-2.09-.04-2.828c-.088-1.883-.973-2.783-2.87-2.87zm-2.829 9.293c-1.985 0-3.595-1.609-3.595-3.595 0-1.985 1.61-3.594 3.595-3.594s3.595 1.609 3.595 3.594c0 1.985-1.61 3.595-3.595 3.595zm3.737-6.491c-.464 0-.84-.376-.84-.84 0-.464.376-.84.84-.84.464 0 .84.376.84.84 0 .463-.376.84-.84.84zm-1.404 2.896c0 1.289-1.045 2.333-2.333 2.333s-2.333-1.044-2.333-2.333c0-1.289 1.045-2.333 2.333-2.333s2.333 1.044 2.333 2.333zm-2.333-12c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6.958 14.886c-.115 2.545-1.532 3.955-4.071 4.072-.747.034-.986.042-2.887.042s-2.139-.008-2.886-.042c-2.544-.117-3.955-1.529-4.072-4.072-.034-.746-.042-.985-.042-2.886 0-1.901.008-2.139.042-2.886.117-2.544 1.529-3.955 4.072-4.071.747-.035.985-.043 2.886-.043s2.14.008 2.887.043c2.545.117 3.957 1.532 4.071 4.071.034.747.042.985.042 2.886 0 1.901-.008 2.14-.042 2.886z" /></svg>
        </a>
      </div>
      <div>
        <a href='https://www.linkedin.com/company/neiist/' target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z" /></svg>
        </a>
      </div>
      <div>
        <a href='https://linktr.ee/NEIIST' target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 48 48"><path d="M24 0C10.745 0 0 10.745 0 24s10.745 24 24 24 24-10.745 24-24S37.255 0 24 0zm1.881 37.001h-3.762v-8.495h3.762v8.495zm8.707-13.622h-6.432l4.581 4.45-2.518 2.528L24 24.107l-6.22 6.25-2.518-2.518 4.581-4.45h-6.432v-3.59h6.402l-4.551-4.339 2.518-2.579 4.339 4.46V11h3.762v6.341l4.338-4.46 2.518 2.579-4.551 4.339h6.402v3.58z"></path></svg>
        </a>
      </div>
      <div>
        <a href='mailto:neiist@tecnico.ulisboa.pt' target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24"><path d="M12 .02c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6.99 6.98l-6.99 5.666-6.991-5.666h13.981zm.01 10h-14v-8.505l7 5.673 7-5.672v8.504z" /></svg>
        </a>
      </div>
      <div>
        <a href='https://github.com/neiist-dev/neiist-website' target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
        </a>
      </div>
    </div>
  </div>
);

const Links = () => (
  <div className={style.footer}>
    <div className={style.footerSpace}>
      <div className={style.footerChildSpace}>
        <h6>Sobre o Núcleo</h6>
        <hr />
        <div><Link as={Link} to="/sobre_nos"><p>Quem Somos?</p></Link></div>
        <div><Link as={Link} to="/contactos"><p>Contactos</p></Link></div>
        <div><Link as={Link} to="/estatutos"><p>Estatutos</p></Link></div>
      </div>
      <div className={style.footerChildSpace}>
        <h6>Cursos de EIC</h6>
        <hr />
        <div>
          <Link as={Link} to={{ pathname: "https://fenix.tecnico.ulisboa.pt/cursos/leic-a" }} target="_blank">
            <p>LEIC-A</p>
          </Link>
          {" / "}
          <Link as={Link} to={{ pathname: "https://fenix.tecnico.ulisboa.pt/cursos/leic-t" }} target="_blank">
            <p>LEIC-T</p>
          </Link>
        </div>
        <div>
          <Link as={Link} to={{ pathname: "https://fenix.tecnico.ulisboa.pt/cursos/meic-a" }} target="_blank">
            <p>MEIC-A</p>
          </Link>
          {" / "}
          <Link as={Link} to={{ pathname: "https://fenix.tecnico.ulisboa.pt/cursos/meic-t" }} target="_blank">
            <p>MEIC-T</p>
          </Link>
        </div>
        <div>
          <Link as={Link} to={{ pathname: "https://fenix.tecnico.ulisboa.pt/cursos/deic" }} target="_blank">
            <p>DEIC</p>
          </Link>
        </div>
      </div>
      <div className={style.footerChildSpace}>
        <h6>Mais Informações</h6>
        <hr />
        <div><Link as={Link} to="/estudantes"><p>Estudantes</p></Link></div>
        <div>
          <Link as={Link} to={{ pathname: "https://sinfo.org" }} target="_blank">
            <p>SINFO 30</p>
          </Link>
        </div>
      </div>
      <div className={style.footerChildSpaceImg}>
        <h6>Powered By</h6>
        <hr />
        <Link as={Link} to={{ pathname: "https://dei.tecnico.ulisboa.pt/" }} target="_blank">
          <div style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/DEI.png)` }} />
        </Link>
      </div>
    </div>
  </div>
);

export default Footer;
