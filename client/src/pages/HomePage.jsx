import React from 'react';
import {Row, Col} from 'react-bootstrap';

import Hero from '../components/homepage/Hero';
import Objectives from '../components/homepage/Objectives';
import Activities from '../components/homepage/Activities';
import Sinfo from '../components/homepage/Sinfo';
import Partnerships from '../components/homepage/Partnerships';
import Mission from '../components/homepage/Mission';
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
      <Partnerships />
    </div>
  );
};

export default HomePage;