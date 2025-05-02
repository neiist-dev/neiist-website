// Maybe get colors from globals.css?
const statusColor: Record<string, string> = {
  NaoSocio: "#000",
  SocioRegular: "#007ec6",
  SocioEleitor: "#97ca00",
  Renovar: "#e05d44",
};

export const statusToColor = (status: string): string => statusColor[status] || "#000";

export const summarizeName = (name: string): string => {
  const names = name.split(" ");
  return `${names[0]} ${names[names.length - 1]}`;
};

export const statusToString = (status: string): string => {
  const newStatus = status.split(/(?=[A-Z])/);
  return newStatus.length === 1 ? newStatus[0] : `${newStatus[0]} ${newStatus[newStatus.length - 1]}`;
};