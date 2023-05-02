export const userDataMock = {
  username: "ist123456",
  displayName: "Mock Name",
  name: "Mock First Second Name",
  email: "mail.mock@tecnico.ulisboa.pt",
  courses: "MEIC-A, MEIC-T",
  status: "NaoSocio",
  isActiveTecnicoStudent: true,
  isActiveLMeicStudent: true,
  isAdmin: false,
  isGacMember: false,
  isMember: true,
  isCollab: false,
  isCoordenator: false,
};

export const electionsMock = [
  {
    id: 1,
    name: "Mock Election",
    startDate: new Date().getDate(),
    endDate: new Date(new Date() + 7 * 24 * 60 * 60 * 1000).getDay(),
    options: [
      { id: 1, name: "Option1", electionId: 1, votes: "0" },
      { id: 2, name: "Option3", electionId: 1, votes: "0" },
      { id: 3, name: "Option4", electionId: 1, votes: "0" },
      { id: 4, name: "Option2", electionId: 1, votes: "0" },
      { id: 5, name: "Other", electionId: 1, votes: "0" },
    ],
  },
  {
    id: 2,
    name: "Mock Election2",
    startDate: new Date().getDate(),
    endDate: new Date(new Date() + 7 * 24 * 60 * 60 * 1000).getDay(),
    options: [
      { id: 1, name: "Option1", electionId: 1, votes: "0" },
      { id: 2, name: "Option3", electionId: 1, votes: "0" },
      { id: 3, name: "Option4", electionId: 1, votes: "0" },
    ],
  },
  {
    id: 3,
    name: "Mock Election3",
    startDate: new Date().getDate(),
    endDate: new Date(new Date() + 7 * 24 * 60 * 60 * 1000).getDay(),
    options: [
      { id: 1, name: "Option1", electionId: 1, votes: "0" },
      { id: 2, name: "Option3", electionId: 1, votes: "0" },
    ],
  },
];