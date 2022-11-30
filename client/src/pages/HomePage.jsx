import React from 'react';
import {Row, Col} from 'react-bootstrap';

import Hero from '../components/homepage/Hero';
import Objectives from '../components/homepage/Objectives';
import Activities from '../components/homepage/Activities';
import Sinfo from '../components/homepage/Sinfo';
import Mission from '../components/homepage/Mission';
import style from './css/HomePage.module.css'

const HomePage = () => {
  return (
    <div className={style.global}>
      <Hero />
      <Row style={{justifyContent: "space-between"}}>
        <Col md={6}>
          <Mission />
        </Col>
        <Col md={6}>
          <Objectives />
        </Col>
      </Row>
      <Activities />
      <Sinfo />
    </div>
  );
};

export default HomePage;