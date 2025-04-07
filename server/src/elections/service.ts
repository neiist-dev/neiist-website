import { CreateElectionDto, Vote } from "./dto";
import { electionsRepository } from "./repository";

const newElection = async (election: CreateElectionDto) => {
  await electionsRepository.createElection(election);
};

const getActiveElections = async () => {
  const currDate = new Date();
  const elections = await electionsRepository.getActiveElections(currDate);
  return elections;
};

const getAllElections = async () => {
  const elections = await electionsRepository.getAllElections();
  return elections;
};

const newVote = async (electionId: number, vote: Vote) => {
  await electionsRepository.createVote(electionId, vote);
};

export const electionsService = {
  newElection,
  getActiveElections,
  getAllElections,
  newVote,
};