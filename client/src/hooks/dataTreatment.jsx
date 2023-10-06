const statusColor = {
  "NaoSocio": "#000",
  "SocioRegular": "#007ec6",
  "SocioEleitor": "#97ca00",
  "Renovar": "#e05d44"
};

export const statusToColor = (status) => statusColor[status];

export const fenixPhoto = (username) => 
  `https://fenix.tecnico.ulisboa.pt/user/photo/${username}?s=10000`;

export const summarizeName = (name) => {
  const names = name.split(" ");
  return names[0] + " " + names[names.length - 1];
};

export const statusToString = (status) => {
  let newStatus = status.split(/(?=[A-Z])/);
  if (newStatus.length === 1) return newStatus[0];
  return newStatus[0] + " " + newStatus[newStatus.length - 1];
}