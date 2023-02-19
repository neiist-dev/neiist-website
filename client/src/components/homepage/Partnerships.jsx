import BlueWhiteBox from "./BlueWhiteBox";
import { Row, Col } from "react-bootstrap";

import mercedesBenzIo from "../../images/partnerships/mercedesBenzIo.png";
import bearingPoint from "../../images/partnerships/bearingPoint.png";

import style from "../../pages/css/HomePage.module.css";

const Partnerships = () => {
	return (
		<div className={style.verticalMargin}>
			<h1>Parcerias</h1>
			<BlueWhiteBox>
				<Row style={{ alignItems: "center" }}>
					<Col>
						<a href="https://www.mercedes-benz.io/">
							<img src={mercedesBenzIo} style={{ width: "20rem" }} />
						</a>
					</Col>
					<Col>
						<a href="https://www.bearingpoint.com/">
							<img src={bearingPoint} style={{ width: "20rem" }} />
						</a>
					</Col>
				</Row>
			</BlueWhiteBox>
		</div>
	);
};

export default Partnerships;
