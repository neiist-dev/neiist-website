import alameda from '../../images/alameda.jpg';
import taguspark from '../../images/taguspark.jpg';
import style from "../css/Hero.module.css";

const Hero = () => {
    return (
        <div style={{height: '100vh'}}>
            <div style={{overflow: 'hidden', opacity: '75%', position: 'absolute', backgroundColor: '#000', width:'50%', height: '100vh', top: '-100px', left: '0px'}}>
            <img
                src={alameda}
                style={{width: '200%', height: '200%', objectFit: 'contains', objectPosition: 'calc( -375px + 50%) -125px'}}/>
            </div>
            <div style={{overflow: 'hidden', opacity: '75%', position: 'absolute', backgroundColor: '#adcff4', width:'50%', height: '100vh', top: '-100px', right: '0px'}}>
            <img
                src={taguspark}
                style={{width: '150%', height: '100%', objectFit: 'contains', objectPosition: 'calc( -250px + 20%) 200px'}}/>
            </div>
            <div style={{position: 'absolute', width: '150%', top: '-50%', left: '-25%', height: 'calc( 375px + 40% )', background: 'var(--bg-color)', borderRadius: '50% / 50% ', filter: 'blur(25px)'}}/>
            <div style={{position: 'relative', height:'75vh', display: 'flex', flexWrap: 'nowrap', flexFlow: 'column nowrap', alignItems: 'center', justifyContent: 'flex-start', alignContent: 'center', flexDirection: 'column'}}>
                <p className={style.title}>
                    Núcleo Estudantil de Informática do Instituto Superior Técnico
                </p>
                <p className={style.subtitle}>
                    Um grupo de estudantes motivados para ajudar todo e qualquer aluno de Engenharia Informática e Computadores (e não só), realizando atividades no ambito da informática e apoio social.
                </p>
            </div>
        </div>
    );
}

export default Hero;