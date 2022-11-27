import React from 'react';
import {Row, Col} from 'react-bootstrap';

import Hero from '../components/homepage/Hero';
import Objectives from '../components/homepage/Objectives';
import Activities from '../components/homepage/Activities';
import Sinfo from '../components/homepage/Sinfo';
import Mission from '../components/homepage/Mission';

const HomePage = () => {
  return (
    <div style={{margin: "0em 6em"}}>
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