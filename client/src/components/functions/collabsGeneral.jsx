import { fenixPhoto, normalizeName } from './dataTreatment.jsx';

export const allTeamNames = {
  CEQ: "Controlo & Qualidade",
  CON: "Contacto",
  DEV: "Dev-Team",
  DIV: "Divulgação",
  FOT: "Fotografia",
  ODE: "Organização de Eventos",
  VIS: "Visuais",
};

export const extendedTeamAndCoorNames = {
  "COOR-CEQ": "Coordenador(a) Controlo & Qualidade",
  "COOR-CON": "Coordenador(a) Contacto",
  "COOR-DEV": "Coordenador(a) Dev-Team",
  "COOR-DIV": "Coordenador(a) Divulgação",
  "COOR-FOT": "Coordenador(a) Fotografia",
  "COOR-ODE": "Coordenador(a) Organização de Eventos",
  "COOR-VIS": "Coordenador(a) Visuais",
  ...allTeamNames,
};

export const normalizeTeams = (teams) => teams.replace("COOR-","").split(",").sort();

export const filterTeamMembers = (teamMembers, team) => (
  teamMembers
    ?.filter((member) => member.teams.includes(team))
    .sort(
      (a, b) =>
        b.teams.includes(`COOR-${team}`) - a.teams.includes(`COOR-${team}`) ||
        b.name?.length - a.name?.lenght
    )
);

export const getCollabImage = (
  name = '', username = '', fileExt = ['.jpg', '.jpeg']
) => {
  if (fileExt.length === 0 || name===''){
    var image = (username) ? fenixPhoto(username) :
      require('../../images/colaboradores/undefinedUser.jpg'); 
    return image;
  }

  try {
    var image= require('../../images/colaboradores/' + normalizeName(name) + fileExt[0]);
    return image;
  } catch {
    return getCollabImage(name, username, fileExt.slice(1,));
  }
};