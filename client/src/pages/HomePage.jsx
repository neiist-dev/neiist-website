import React from 'react';
import { Row, Col } from 'react-bootstrap';

import Hero from '../components/homepage/Hero.jsx';
import Objectives from '../components/homepage/Objectives.jsx';
import Activities from '../components/homepage/Activities.jsx';
import Sinfo from '../components/homepage/Sinfo.jsx';
import Sweats from '../components/homepage/SweatsBanner.jsx';
import Partnerships from '../components/homepage/Partnerships.jsx';
import Mission from '../components/homepage/Mission.jsx';
import style from './css/HomePage.module.css'

const HomePage = () => {
  return (
    <div className={style.global}>
      <Hero />
      {/*  SPACE  */}
      <div
        style={{
          position: "relative",
          height: "5vw",
          zIndex: "-1"
        }}
      />
      <Sweats />
      <Row style={{ justifyContent: "space-between" }}>
        <Col md={6}>
          <Mission />
        </Col>
        <Col md={6}>
          <Objectives />
        </Col>
      </Row>
      <Activities />
      <Sinfo />
      <Partnerships />
    </div>
  );
};

export default HomePage;