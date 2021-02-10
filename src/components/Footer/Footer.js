import React, { useState } from 'react';
import './Footer.css';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faLinkedinIn, faInstagram, faTwitch, faGithub } from '@fortawesome/free-brands-svg-icons';


function Footer() {
    const [hover, setHover] = useState(false);
    const [click, setClick] = useState(false);

    return (
        <footer className="footer">
            <div id="links-circle">
                <a id="fa-facebook" target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/gce.neiist" className="fa"><FontAwesomeIcon icon={faFacebookF} /></a>
                <a id="fa-instagram" target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/gce.neiist" className="fa"><FontAwesomeIcon icon={faInstagram} /></a>
                <a id="fa-linkedin" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/company/11163917" className="fa"><FontAwesomeIcon icon={faLinkedinIn} /></a>
                <a id="fa-twitch" target="_blank" rel="noopener noreferrer" href="https://www.twitch.tv/gce_neiist" className="fa"><FontAwesomeIcon icon={faTwitch} /></a>
                <a id="fa-github" target="_blank" rel="noopener noreferrer" href="https://github.com/GCE-NEIIST/GCE-NEIIST-webapp" className="fa"><FontAwesomeIcon icon={faGithub} /></a>
                <OverlayTrigger
                    show={hover && !click}
                    onToggle={(show) => {
                        if (show) {
                            setHover(true);
                        } else {
                            setHover(false);
                        }
                    }}
                    placement="top"
                    overlay={<Tooltip>Copiar para a área de transferência</Tooltip>}>
                    <div id="email-inline-display">
                        <OverlayTrigger
                            show={hover && click}
                            onToggle={(show) => {
                                if (!show) {
                                    setClick(false);
                                    setHover(false);
                                }
                            }}
                            placement="top" overlay={<Tooltip>Copiado ✔️</Tooltip>}>
                            <div id="fa-envelope" onClick={() => { navigator.clipboard.writeText("admin@gce-neiist.org"); setClick(true); }} className="fa copy-click">
                                <FontAwesomeIcon icon={faEnvelope} />
                            </div>
                        </OverlayTrigger>
                    </div>
                </OverlayTrigger>
            </div>
        </footer>
    );
}

export default Footer;