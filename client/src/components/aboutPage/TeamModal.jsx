import parse from 'html-react-parser';
import { Modal } from 'react-bootstrap';
import DivPersonCard from './CollabCard';
import { getCollabImage } from '../functions/collabsGeneral.jsx';

import style from '../../pages/css/AboutPage.module.css'

const CreateTeamModal = ({
  teamId,
  teamName,
  icon,
  show,
  handleClose,
  activeMembers,
}) => (
  <Modal show={show} onHide={handleClose} size='xl'>
    <Modal.Header closeButton className={style.headerModal}>
      <Modal.Title className={style.headerModalTitle}>
        {icon} {teamName}
      </Modal.Title>
    </Modal.Header>
    <Modal.Body className={style.bodyModal}>
      <p style={{ textAlign: 'justify', fontSize: '1em' }}>
        {parse(
          TeamResume[teamId].replace(`${teamName}`, `<b>${teamName}</b>`)
        )}
      </p>
      <hr />
      <ActiveMembersDiv
        activeTeamMembers={activeMembers?.filter((member) => member.teams.includes(teamId))}
      />
    </Modal.Body>
  </Modal>
);

const ActiveMembersDiv = ({ activeTeamMembers }) => (
  <>
    <h4>Membros da Equipa ({activeTeamMembers.length ?? '0'})</h4>
    <div className={`${style.allMembersCard} ${style.activeTeamMembers}`}>
      {activeTeamMembers?.map((member, index) => (
        <DivPersonCard
          key={index}
          name={`${member.name.split(' ')[0]}\n${member.name.split(' ')[1]}`}
          image={getCollabImage(member.name)}
        />
      ))}
    </div>
  </>
);

const TeamResume = {
  'CON': 'O trabalho na equipa de Contacto consiste em estabelecer e desenvolver relações com empresas, de modo a aproximá-las dos estudantes. Nisto está inserido: reunir com empresas para estabelecer os moldes de uma parceria,  angariação de patrocínios para eventos do NEIIST, planeamento de eventos em parceria com empresas, angariação de empresas para os IST Summer Internships, entre outros...',
  'CEQ': 'O trabalho no Controlo & Qualidade consiste na criação e partilha de formulários de forma a obter o feedback dos alunos em relação aos eventos organizados pelo NEIIST. No final de cada evento é elaborado um relatório para avaliar os resultados e para que os colaboradores saibam o que melhorar em eventos seguintes.',
  'DEV': 'A Dev-Team é a equipa de colaboradores do NEIIST que está responsável pelo site do núcleo, desde a sua manutenção até à implementação de novas funcionalidades. Os elementos da equipa trabalham tanto no backend como no frontend do site, de modo a melhorar as ferramentas disponíveis no site.',
  'DIV': 'O trabalho da equipa de Divulgação consiste na coordenação entre a divulgação de todos os eventos organizados pelo NEIIST e de alguns eventos que pedem ao núcleo para divulgar. Os membros desta equipa produzem o texto a seguir para cada evento, divulgando posteriormente pelas redes sociais (ex. Instagram, Facebook e/ou LinkedIn) e pelos grupos (ex. Discord, WhatsApp) de EIC, podendo adaptar-se ao tipo de evento e ao público alvo.',
  'FOT': 'O trabalho da equipa de Fotografia consiste na cobertura fotográfica e/ou videográfica de eventos organizados pelo NEIIST de modo a expandir a nossa galeria e a mostrar a todos os interessados o trabalho do núcleo. Os membros desta equipa fotografam e/ou filmam os eventos e depois editam o material para ficar pronto para publicação.',
  'ODE': 'A Organização de Eventos é algo diferente do trabalho nas restantes equipas, pode variar bastante de evento para evento, mas inclui sempre tratar da logística, falar com possíveis oradores e/ou outros intervenientes na organização do evento (talvez até falar com possíveis patrocinadores, se for esse o caso) e fazer a ponte com as outras equipas do NEIIST envolvidas no evento.',
  'VIS': 'O trabalho da equipa de Visuais consiste na criação de cartazes, banners, panfletos e outros materiais visuais para ajudar à divulgação de eventos organizados pelo NEIIST, para garantir que estes chegam ao maior número possível de alunos. Os membros da equipa produzem o material pedido e recebem feedback da equipa, antes de o enviar para os organizadores do evento que pedem as alterações necessárias, se for esse o caso.',
};

export default CreateTeamModal;