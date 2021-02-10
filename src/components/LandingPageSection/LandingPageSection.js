import React from 'react';
import Button from 'react-bootstrap/Button';
import './LandingPageSection.css';

function LandingPageSection({ id, position, title, body_text, button_text }) {
    return (
        <section id={id} className="fullscreen_section">
            <div className={`content ${position}`}>
                <h1 className="title">{title}</h1>
                <p className="body_text">{body_text}</p>
                <Button className="btt" variant="primary" size="lg">{button_text}</Button>
            </div>
        </section>
    );
}

export default LandingPageSection;


