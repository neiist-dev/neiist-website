export const allTeamNames = {
  'CEQ':'Controlo & Qualidade',
  'CON':'Contacto',
  'DEV':'Dev-Team',
  'DIV':'Divulgação',
  'FOT':'Fotografia',
  'ODE':'Organização de Eventos',
  'VIS':'Visuais',
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

export const getImage = (name, fileExt = ['.jpg', '.jpeg']) => {
  if (fileExt.length === 0){
    var image = require('../../images/colaboradores/undefinedUser.jpg');
    return image;
  }

  try {
    var image = require('../../images/colaboradores/' + normalizeName(name) + fileExt[0]);
    return image;
  } catch {
    return getImage(name, fileExt.slice(1,));
  }
};