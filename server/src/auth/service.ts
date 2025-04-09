import axios from "axios";
import { collaboratorsRepository } from "../collaborators/repository";
import { collaboratorsService } from "../collaborators/service";
import { membersService } from "../members/service";
import type { FenixPerson, FenixRole, UserData } from "./dto";

const getAccessToken = async (code: string): Promise<string | null> => {
	try {
		const accessTokenResponse = await axios.post(
			`https://fenix.tecnico.ulisboa.pt/oauth/access_token?client_id=${process.env.FENIX_CLIENT_ID}&client_secret=${encodeURIComponent(
				process.env.FENIX_CLIENT_SECRET as string,
			)}&redirect_uri=${process.env.FENIX_REDIRECT_URI}&code=${encodeURIComponent(code)}&grant_type=authorization_code`,
		);

		if (
			accessTokenResponse === undefined ||
			accessTokenResponse.status !== 200
		) {
			return null;
		}

		return accessTokenResponse.data.access_token;
	} catch (error) {
		console.error(error);
		return null;
	}
};

const getPersonInformation = async (
	accessToken: string,
): Promise<FenixPerson | null> => {
	try {
		const personInformationResponse = await axios.get(
			`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/person?access_token=${accessToken}`,
		);

		if (
			personInformationResponse === undefined ||
			personInformationResponse.status !== 200
		) {
			return null;
		}

		return personInformationResponse.data;
	} catch (error) {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		throw new Error((error as any).response.data.error);
	}
};

const isActiveTecnicoStudent = (roles: FenixRole[]) =>
	roles.some((role) => role.type === "STUDENT");

const isActiveLMeicStudent = (roles: FenixRole[]) => {
	const LMeicAcronyms = ["LEIC-A", "LEIC-T", "MEIC-A", "MEIC-T"];

	return roles.some(
		(role) =>
			role.type === "STUDENT" &&
			role.registrations?.some((registration) =>
				LMeicAcronyms.includes(registration.acronym),
			),
	);
};

const isGacMember = async (username: string) => {
	// GAC = general assembly committee (MAG in PT)
	const gacMembers = await collaboratorsRepository.checkGACMember(username);
	const gacUsernames = process.env.GAC_USERNAMES?.split(",") || [];
	return gacUsernames.includes(username) || gacMembers;
};

const isCoordenator = async (username: string) => {
	const isCoordenator =
		await collaboratorsRepository.checkCoordenator(username);
	return isCoordenator;
};

const isAdmin = async (username: string) => {
	const adminCollabs = await collaboratorsRepository.checkAdmin(username);
	const adminUsernames = process.env.ADMIN_USERNAMES?.split(",") || [];
	return adminUsernames.includes(username) || adminCollabs;
};

const isCollab = async (username: string) => {
	const collab = await collaboratorsService.checkCurrentCollab(username);
	return collab ? collab : false;
};

const getAcronyms = (personInformation: FenixPerson) => {
	const acronyms: string[] = [];

	for (const role of personInformation.roles) {
		if (role.type === "STUDENT")
			for (const registration of role.registrations || [])
				acronyms.push(registration.acronym);
	}
	return acronyms.join();
};

const getUserData = async (accessToken: string) => {
	try {
		const personInformation = await getPersonInformation(accessToken);
		if (!personInformation) {
			throw new Error("User not found");
		}

		const acronyms = getAcronyms(personInformation);
		const member = await membersService.getMember(personInformation.username);
		const isMember = !!member;

		const userData: UserData = {
			username: personInformation.username,
			displayName: personInformation.displayName,
			name: personInformation.name,
			email: personInformation.institutionalEmail,
			courses: acronyms,
			status: member ? member.status : "NaoSocio",
			isActiveTecnicoStudent: isActiveTecnicoStudent(personInformation.roles),
			isActiveLMeicStudent: isActiveLMeicStudent(personInformation.roles),
			isAdmin: !!(await isAdmin(personInformation.username)),
			isGacMember: !!(await isGacMember(personInformation.username)),
			isMember,
			isCollab: await isCollab(personInformation.username),
			isCoordinator: !!(await isCoordenator(personInformation.username)),
		};
		return userData;
	} catch (error) {
		throw new Error(error as string);
	}
};

export const authService = {
	getAccessToken,
	getUserData,
};
