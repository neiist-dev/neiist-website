import BlueWhiteBox from './BlueWhiteBox.jsx';
import ObjectiveItem from './ObjectiveItem.jsx';
import style from '../../pages/css/HomePage.module.css'

const Objectives = () => {
    return (
        <div className={style.verticalMargin}>
            <h1>Objetivos</h1>
            <BlueWhiteBox className={`${style.objectives} ${style.missionAndObjectives}`}>
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
            </BlueWhiteBox>
        </div>
    );
}

export default Objectives;