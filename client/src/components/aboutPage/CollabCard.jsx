import { Card } from 'react-bootstrap';
import style from '../../pages/css/AboutPage.module.css';

const DivPersonCard = ({ name, job, image, teams }) => {
  console.log("teams -> ", teams);
  const isCoordinator = teams?.includes('COOR-');

  return (
    <div className={style.cardContainer}>
      <PersonCard name={name} job={job} src={image} isCoordinator={isCoordinator} />
    </div>
  );
};

const PersonCard = ({ name, job, src, isCoordinator }) => (
  <Card className={`${style.card}`}>
    <Card.Img className={`${style.cardImg} hover-zoom hover-shadow`} variant="top" src={src} />
    <Card.ImgOverlay className={style.cardImgOver}>
      {isCoordinator && (
        <div className={style.coordinatorCard}>Coordenador(a)</div>
      )}
      <Card.Title bsPrefix={style.cardTitle}>{name}</Card.Title>
      {job && <Card.Text bsPrefix={style.cardText}>{job}</Card.Text>}
    </Card.ImgOverlay>
  </Card>
);

export default DivPersonCard;