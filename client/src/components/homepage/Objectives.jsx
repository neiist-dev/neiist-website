import BlueWhiteBox from './BlueWhiteBox';
import ObjectiveItem from './ObjectiveItem';

const Objectives = () => {
    return (
        <>
            <h1 style={{textAlign: "left"}}>Objetivos</h1>
            <BlueWhiteBox>
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
            </BlueWhiteBox>
        </>
    );
}

export default Objectives;