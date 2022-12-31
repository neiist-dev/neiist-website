import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";

import style from "../../pages/css/CollabsPage.module.css";

const DivPersonCard = ({ name, selectedTeam='', teams, showTeams=false, image, social }) => (
  <div className={style.cardContainer}>
    <PersonCard
      name={name}
      src={image}
      social={social}

      teams={teams}
      selectedTeam={selectedTeam}
      showTeams={showTeams}
    />
  </div>
);

const PersonCard = ({ 
  name, src, social, teams, selectedTeam, showTeams
}) => (
  <Card className={style.card}>
    {teams?.includes(`COOR-${selectedTeam}`) && (
      <div className={style.coordenatorBadge}>
        <Badge bg="dark">Coordenador(a)</Badge>
      </div>
    )}
    <Card.Img className={style.cardImg} variant="top" src={src} />
    <Card.Body style={{ padding: ".5rem .5rem" }}>
      <Card.Title className={style.cardTitle}>{name}</Card.Title>
      {social && (
        <Card.Subtitle className="mb-1 text-muted">{social}</Card.Subtitle>
      )}
      {teams && showTeams && (
        <div className={style.memberCard}>
          {teams
            .split(",")
            .sort(
              (a, b) =>
                b.includes(`COOR`) - a.includes(`COOR`) || (a > b ? 1 : -1)
            )
            .map((member, index) => (
              <Badge
                key={index}
                pill
                bg={member.includes("COOR") ? "success" : "primary"}
              >
                {member}
              </Badge>
            ))}
        </div>
      )}
    </Card.Body>
  </Card>
);

export default DivPersonCard;
