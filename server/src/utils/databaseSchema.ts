import { areasRepository } from "../areas/repository";
import { collaboratorsRepository } from "../collaborators/repository";
import { electionsRepository } from "../elections/repository";
import { membersRepository } from "../members/repository";
import { ordersRepository } from "../store/ordersRepository";
import { thesesRepository } from "../theses/repository";

export const initializeSchema = async () => {
    await areasRepository.createAreas();
    await thesesRepository.createTheses();
    await membersRepository.createMembers();
    await collaboratorsRepository.createCollaborators();
    await collaboratorsRepository.createCurrentCollabView();
    await collaboratorsRepository.createCoordenatorsView();
    await collaboratorsRepository.createGACMembersView();
    await membersRepository.createRenewalNotifications();
    await collaboratorsRepository.createAdminsView();
    await electionsRepository.createElections();
    await electionsRepository.createOptions();
    await electionsRepository.createVotes();
    await ordersRepository.createOrders();
};