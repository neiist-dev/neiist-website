import BlueWhiteBox from "./BlueWhiteBox";
import { Row, Col } from "react-bootstrap";

import mercedesBenzIo from "../../images/partnerships/mercedesBenzIo.png";
import auren from "../../images/partnerships/auren.png";
import managementSolutions from "../../images/partnerships/managementSolutions.png";
import basedInLisbon from "../../images/partnerships/BasedInLisbon.png";

import style from "../../pages/css/HomePage.module.css";

const Partnerships = () => {
    return (
        <div className={style.verticalMargin}>
            <h1>Parcerias</h1>
            <BlueWhiteBox>
                <Row className={style.partners}>
                    <Col>
                        <a href="https://www.mercedes-benz.io/" target="_blank">
                            <img src={mercedesBenzIo} style={{ width: "50%", scale: "1.5" }} />
                        </a>
                    </Col>
                    <Col>
                        <a href="https://auren.com/pt/" target="_blank">
                            <img src={auren} style={{ width: "50%", scale: "0.75" }} />
                        </a>
                    </Col>
                    <Col>
                        <a href="https://www.managementsolutions.com/" target="_blank">
                            <img src={managementSolutions} style={{ width: "50%", scale: "1.0" }} />
                        </a>
                    </Col>
                    <Col>
                        <a href="https://www.basedinlisbon.xyz/" target="_blank">
                            <img src={basedInLisbon} style={{ width: "50%", scale: "1.0" }} />
                        </a>
                    </Col>
                </Row>
            </BlueWhiteBox>
        </div>
    );
};

export default Partnerships;
