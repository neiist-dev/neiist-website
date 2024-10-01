import React from "react";
import { Row, Col } from "react-bootstrap";

const ContactsPage = () => (
	<>
		<div style={{ margin: "2rem 6rem 1rem 6rem" }}>
			<h1 style={{ textAlign: "center" }}>CONTACTOS</h1>
		</div>

		<Row
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "flex-end",
			}}
		>
			<Col md={5} lg={4} xl={3} style={{ margin: "0.5rem", textAlign: "center" }}>
				<h2>EMAIL</h2>
				<p>neiist@tecnico.ulisboa.pt</p>
			</Col>

			<Col md={5} lg={4} xl={3} style={{ margin: "0.5rem", textAlign: "center" }}>
				<h2>TELEFONE</h2>
				<p>218417000 (extensão: 2572)</p>
			</Col>
		</Row>

		<div style={{ margin: "1rem", textAlign: "center" }}>
			<h2>SALAS</h2>
			<Row
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "flex-end",
				}}
			>
				<Col md={5} lg={4} xl={3} style={{ margin: "0.5rem" }}>
					<p>
						Sala 3.03
						<br />
						Pavilhão de Informática I
						<br />
						Campus Alameda
						<br />
						Av. António José de Almeida
					</p>
					<iframe
						title="NEIIST Alameda"
						src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2617.0053052397884!2d-9.138373757283224!3d38.737059977104856!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1933a3aaf6fbeb%3A0x3cf91d3b80a0520b!2sAv.+Rovisco+Pais+1%2C+1049-001+Lisboa!5e0!3m2!1spt-PT!2spt!4v1473459139674"
						width="auto"
						height="300"
					/>
				</Col>
				<Col md={5} lg={4} xl={3} style={{ margin: "0.5rem" }}>
					<p>
						Sala 1.18
						<br />
						Campus Taguspark
						<br />
						Av. Prof. Doutor Aníbal Cavaco Silva
					</p>
					<iframe
						title="NEIIST Taguspark"
						src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3112.1489108761316!2d-9.30531258433926!3d38.737344963967004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1ecef46471ad41%3A0x928a2fedee483006!2sInstituto+Superior+T%C3%A9cnico+-+Taguspark!5e0!3m2!1spt-PT!2spt!4v1473458606512"
						width="auto"
						height="300"
					/>
				</Col>
			</Row>
		</div>

		<div style={{ margin: "2rem 6rem 2rem 6rem", textAlign: "center" }}>
			<h2 style={{ textAlign: "center" }}>CORREIO</h2>
			<p>
				NEIIST (Núcleo Estudantil de Informática do IST)
				<br />
				Departamento de Engenharia Informática
				<br />
				Instituto Superior Técnico
				<br />
				Av. Rovisco Pais 1, 1049-001 LISBOA
			</p>
		</div>
	</>
);

export default ContactsPage;
