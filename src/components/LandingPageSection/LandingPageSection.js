import React from 'react';
import { Button } from '@material-ui/core';
import './LandingPageSection.css';

function LandingPageSection({ id, position, title, body_text, button_text }) {
    return (
        <section id={id} className="fullscreen_section">
            <div className={`content ${position}`}>
                <h1 className="title">{title}</h1>
                <p className="body_text">{body_text}</p>
                <Button color="primary">{button_text}</Button>
            </div>
        </section>
    );
}

export default LandingPageSection;


