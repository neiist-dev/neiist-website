import BlueWhiteBox from "./BlueWhiteBox";
import PartnerItem from './PartnerItem.jsx';
import { Row, _ } from "react-bootstrap";
import style from "../../pages/css/HomePage.module.css";

// Monetary Partners
import auren from "../../images/partnerships/monetary/auren.png";
import deloitte from "../../images/partnerships/monetary/deloitte.png";
import basedInLisbon from "../../images/partnerships/monetary/based_in_lisbon.png";

// Non-Monetary Partners
import lage2 from "../../images/partnerships/non-monetary/lage2.png";
import aiesec from "../../images/partnerships/non-monetary/aiesec.png";
import magma from "../../images/partnerships/non-monetary/magma.png";

const Partnerships = () => {
    return (
        <div className={style.verticalMargin}>
            <h1 style={{ fontWeight: "bold" }}>Parcerias</h1>
            <BlueWhiteBox>
                <h5 style={{ fontWeight: "bold" }}>Parcerias Monetárias</h5>
                <Row className={style.partners} style={{ gap: "10px" }}>
                    <PartnerItem alt="Auren" src={auren} href="https://auren.com/pt/" scale="1.25" />
                    <PartnerItem alt="Deloitte" src={deloitte} href="https://www.deloitte.com/" />
                    <PartnerItem alt="Based in Lisbon" src={basedInLisbon} href="https://www.basedinlisbon.xyz/" />
                </Row>
                <br />
                <h5 style={{ fontWeight: "bold" }}>Parcerias Não Monetárias</h5>
                <Row className={style.partners} style={{ gap: "10px" }}>
                    <PartnerItem alt="LAGE2" src={lage2} href="https://lage2.ist.utl.pt/" scale="0.75" />
                    <PartnerItem alt="AIESEC" src={aiesec} href="https://aiesec.org/" scale="1.25" />
                    <PartnerItem alt="Magma Studio" src={magma} href="https://magmastudio.pt/" />
                </Row>
            </BlueWhiteBox>
        </div>
    );
};

export default Partnerships;
