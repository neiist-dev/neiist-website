import React from 'react';
import style from '@/styles/pages/HomePage.module.css';

const Mission: React.FC = () => {
    return (
        <div className={style.verticalMargin}>
            <h1>Missão</h1>
            <p>
                O NEIIST ambiciona ser o núcleo que integra, apoia e dinamiza todos os grupos, comunidades 
                e iniciativas com impacto no percurso de estudantes do IST com interesses em Tecnologias 
                de Informação.
            </p>
            <p>
                Para tal, pretende criar uma plataforma que promova a cooperação entre estudantes, 
                e entre estes e docentes, 
                órgãos institucionais e empresas, centrada na criação de oportunidades e 
                no associativismo e valorização pessoal.
            </p>
        </div>
    );
}

export default Mission;