export const fenixPhoto = (username) => 
`https://fenix.tecnico.ulisboa.pt/user/photo/${username}?s=10000`;

export const summarizeName = (name) => {
    const names = name.split(" ");
    return names[0] + " " + names[names.length - 1];
  };