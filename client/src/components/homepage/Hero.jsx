import background from "../../images/background.png";
import style from "../css/Hero.module.css";

const Hero = () => {
	return (
		<div style={{ height: "90vh" }}>
			<div
				style={{
					overflow: "hidden",
					opacity: "75%",
					position: "absolute",
					top: "90px",
					left: "0px",
					height: "75vh",
					width: "100vw"
				}}
			>
				<img
					src={background}
					style={{
						height: "100%",
						width: "100%",			
                        objectFit: "cover"
					}}
				/>
			</div>
            {/*  BLUR  */}
			<div
				style={{
					position: "absolute",
					width: "150%",
					top: "-50%",
					left: "-25%",
					height: "calc( 475px + 40% )",
					background: "var(--bg-color)",
					borderRadius: "50% / 30% ",
					filter: "blur(25px)",
				}}
			/>
            {/*  TEXT  */}
			<div
				style={{
					position: "relative",
					display: "flex",
					flexWrap: "nowrap",
					flexFlow: "column nowrap",
					alignItems: "center",
					justifyContent: "flex-start",
					alignContent: "center",
					flexDirection: "column",
				}}
			>
				<p className={style.title}>
					Núcleo Estudantil de Informática do Instituto Superior Técnico
				</p>
				<p className={style.subtitle}>
					Um grupo de estudantes motivados para ajudar todo e qualquer aluno de
					Engenharia Informática e Computadores (e não só), realizando
					atividades no ambito da informática e apoio social.
				</p>
			</div>
		</div>
	);
};

export default Hero;
