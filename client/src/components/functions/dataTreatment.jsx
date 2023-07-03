export const fenixPhoto = (username) => 
`https://fenix.tecnico.ulisboa.pt/user/photo/${username}?s=10000`;

export const summarizeName = (name) => {
  if (name!==null && name!==undefined){
    const names = name.split(" ");
    return names[0] + " " + names[names.length - 1];
  }
};

export const normalizeName = (name) => (removeAccent(name).replace(" ", ""));

export const normalizeJob = (job) => (job.replace(/[0-9]{1,}/g, ""));

export const removeAccent = (name) =>
  (name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
