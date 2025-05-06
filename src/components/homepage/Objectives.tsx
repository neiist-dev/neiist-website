import React from 'react';
import ObjectiveItem from './ObjectiveItem';
import style from '@/styles/pages/HomePage.module.css';

const Objectives: React.FC = () => {
    return (
        <div className={style.verticalMargin}>
            <h1>Objetivos</h1>
            <ObjectiveItem 
                color="darkblue"
                text="Organizar diversas atividades no âmbito da informática e valorização pessoal"
            />
            <ObjectiveItem 
                color="#248BE3"
                text="Estimular o interesse pela informática e a divulgação da mesma dentro e fora do Instituto Superior Técnico"
            />
            <ObjectiveItem 
                color="darkblue"
                text="Contribuir para o relacionamento nacional e internacional dos estudantes de informática e de outras áreas afins"
            />
            <ObjectiveItem 
                color="#248BE3"
                text="Estimular o associativismo e o espírito de equipa dentro das licenciaturas da responsabilidade do DEI-IST"
            />
            <ObjectiveItem 
                color="darkblue"
                text="Promover a imagem das licenciaturas, mestrados e doutoramentos da responsabilidade do DEI"
            />
            <ObjectiveItem 
                color="#248BE3"
                text="Promover o relacionamento entre professores, alunos, profissionais do ramo e empresas"
            />
        </div>
    );
}

export default Objectives;