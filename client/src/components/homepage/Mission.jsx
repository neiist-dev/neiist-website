import BlueWhiteBox from './BlueWhiteBox.jsx';
import style from '../../pages/css/HomePage.module.css'

const Mission = () => {
    return (
        <div className={style.verticalMargin}>
            <h1>Missão</h1>
            <BlueWhiteBox className={style.missionAndObjectives}>
                <p>
                    O NEIIST ambiciona ser o núcleo que integra, apoia e dinamiza todos os grupos,comunidades 
                    e iniciativas com impacto no percurso de estudantes do IST com interesses em Tecnologias 
                    de Informação.
                </p>
                <p>
                    Para tal, pretende criar uma plataforma que promova a cooperação entre estudantes, 
                    e entre estes e docentes, 
                    órgãos institucionais e empresas, centrada na criação de oportunidades e 
                    no associativismo e valorização pessoal.
                </p>
            </BlueWhiteBox>
        </div>
    );
}

export default Mission;