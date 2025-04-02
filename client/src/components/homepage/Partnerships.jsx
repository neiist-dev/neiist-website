import BlueWhiteBox from "./BlueWhiteBox";
import { Row, Col } from "react-bootstrap";

// Monetary
import auren from "../../images/partnerships/monetary/auren.png";
import managementSolutions from "../../images/partnerships/monetary/management_solutions.png";
import basedInLisbon from "../../images/partnerships/monetary/based_in_lisbon.png";

// Non-Monetary
import lage2 from "../../images/partnerships/non-monetary/lage2.png";
import aiesec from "../../images/partnerships/non-monetary/aiesec.png";
import magma from "../../images/partnerships/non-monetary/magma.png";

import style from "../../pages/css/HomePage.module.css";

const Partnerships = () => {
    return (
        <div className={style.verticalMargin}>
            <h1 style={{ fontWeight: "bold" }}>Parcerias</h1>
            <BlueWhiteBox>
                <h5 style={{ fontWeight: "bold" }}>Parcerias Monetárias</h5>
                <Row className={style.partners} style={{ gap: "10px" }}>
                    <Col style={{ display: "flex", justifyContent: "center" }}>
                        <a href="https://auren.com/pt/" target="_blank" rel="noopener noreferrer">
                            <img src={auren} style={{ width: "50%", scale: "1.25", fontWeight: "bold" }} alt="Auren" />
                        </a>
                    </Col>
                    <Col style={{ display: "flex", justifyContent: "center" }}>
                        <a href="https://www.managementsolutions.com/" target="_blank" rel="noopener noreferrer">
                            <img src={managementSolutions} style={{ width: "50%", scale: "1.0", fontWeight: "bold" }} alt="Management Solutions" />
                        </a>
                    </Col>
                    <Col style={{ display: "flex", justifyContent: "center" }}>
                        <a href="https://www.basedinlisbon.xyz/" target="_blank" rel="noopener noreferrer">
                            <img src={basedInLisbon} style={{ width: "50%", scale: "1.0", fontWeight: "bold" }} alt="Based in Lisbon" />
                        </a>
                    </Col>
                </Row>
                <br/>
                <h5 style={{ fontWeight: "bold" }}>Parcerias Não Monetárias</h5>
                <Row className={style.partners} style={{ gap: "10px" }}>
                    <Col style={{ display: "flex", justifyContent: "center" }}>
                        <a href="https://lage2.ist.utl.pt/" target="_blank" rel="noopener noreferrer">
                            <img src={lage2} style={{ width: "50%", scale: "0.75", fontWeight: "bold" }} alt="LAGE2" />
                        </a>
                    </Col>
                    <Col style={{ display: "flex", justifyContent: "center" }}>
                        <a href="https://aiesec.org/" target="_blank" rel="noopener noreferrer">
                            <img src={aiesec} style={{ width: "50%", scale: "1.0", fontWeight: "bold" }} alt="AIESEC" />
                        </a>
                    </Col>
                    <Col style={{ display: "flex", justifyContent: "center" }}>
                        <a href="https://magmastudio.pt/" target="_blank" rel="noopener noreferrer">
                            <img src={magma} style={{ width: "50%", scale: "1.0", fontWeight: "bold" }} alt="Magma Studio" />
                        </a>
                    </Col>
                </Row>
            </BlueWhiteBox>
        </div>
    );
};

export default Partnerships;
