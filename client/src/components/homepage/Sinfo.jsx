import BlueWhiteBox from './BlueWhiteBox';
import {Row, Col} from 'react-bootstrap';

import sinfo from '../../images/sinfo.png';

import style from '../../pages/css/HomePage.module.css'

const Sinfo = () => {
    return (
        <div className={style.verticalMargin}>
            <h1 style={{textAlign: "left"}}>Secção Autónoma</h1>
            <BlueWhiteBox>
                <Row style={{alignItems: "center"}}>
                    <Col xl={6}>
                        <img src={sinfo} style={{width: "80%"}}/>
                        <br/>
                        <button className={style.sinfoButton}> Visita a SINFO! </button>
                    </Col>
                    <Col xl={6}>
                        <p>
                            A SINFO é um evento anual organizado exclusivamente por estudantes que se esforçam para tornar o 
                            evento mais interessante e inovador a cada edição. Todos os participantes têm o direito de 
                            experimentar alguns dos gadgets e tecnologias mais inovadoras do mercado para além de lhes ser 
                            apresentado uma visão geral do cenário de TI pelas melhores empresas do país. Para além disto tudo, 
                            todos os dias são realizados workshops nos temas mais requisitados e recentes, permitindo a todos 
                            os participantes que melhorem as suas skills técnicas e não-técnicas.
                        </p>
                        <p>
                            O principal objetivo da SINFO é permitir que todos os estudantes e os participantes em geral
                            possam interagir e estar mais próximos de pessoas ou empresas influentes e interessantes no ramo 
                            das Tecnologias de Informação e Engenharia Informática.
                        </p>
                    </Col>
                </Row>
            </BlueWhiteBox>
        </div>  
    );
}

export default Sinfo;