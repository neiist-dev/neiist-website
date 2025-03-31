import BlueWhiteBox from "./BlueWhiteBox";
import { Row, Col } from "react-bootstrap";

import auren from "../../images/partnerships/monetary/auren.png";
import managementSolutions from "../../images/partnerships/monetary/managementSolutions.png";
import basedInLisbon from "../../images/partnerships/monetary/BasedInLisbon.png";
import lage from "../../images/partnerships/non_monetary/lage.png";
import aeiesec from "../../images/partnerships/non_monetary/aiesec.png";
import magma from "../../images/partnerships/non_monetary/magma.png";

import style from "../../pages/css/HomePage.module.css";

const Partnerships = () => {
   return (
      <div className={style.verticalMargin}>
         <h1>Parcerias</h1>
         <BlueWhiteBox>
            <Row className={style.partners}>
                <p className={style.partnershipTitle} style={{marginTop: "40px"}}>
                  Parcerias monetárias:
               </p>
               <Col>
                  <a href="https://auren.com/pt/" target="_blank">
                     <img src={auren} style={{ width: "40%", scale: "1" }} />
                  </a>
               </Col>
               <Col>
                  <a href="https://www.basedinlisbon.xyz/" target="_blank">
                     <img src={basedInLisbon} style={{ width: "40%", scale: "1" }} />
                  </a>
               </Col>
               <Col>
                  <a href="https://www.managementsolutions.com/" target="_blank">
                     <img src={managementSolutions} style={{ width: "40%", scale: "1.4" }} />
                  </a>
               </Col>
            </Row>

            <Row className={style.partners}>
            <p className={style.partnershipTitle}>
                  Parcerias não monetárias:
               </p>
               <Col>
                  <a href="https://www.linkedin.com/company/lage2/?trk=ppro_cprof&originalSubdomain=pt" target="_blank">
                     <img src={lage} style={{ width: "40%", scale: "0.9" }} />
                  </a>
               </Col>
               <Col>
                  <a href="https://aiesec.org/" target="_blank">
                     <img src={aeiesec} style={{ width: "40%", scale: "1.4" }} />
                  </a>
               </Col>
               <Col>
                  <a href="https://magmastudio.pt/" target="_blank">
                     <img src={magma} style={{ width: "40%", scale: "1" }} />
                  </a>
               </Col>
            </Row>
         </BlueWhiteBox>
      </div>
   );
};

export default Partnerships;
