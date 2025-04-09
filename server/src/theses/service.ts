import type { BayesClassifier } from "natural";
import { htmlParser } from "../utils/htmlParser";
import { thesesClassifierService } from "./classifierService";
import type { Thesis, ThesisWithAreas } from "./dto";
import { thesesRepository } from "./repository";

const classifyTheses = async (
	parsedTheses: Thesis[],
	trainedClassifier: BayesClassifier,
) => {
	const classifiedTheses = parsedTheses.map((thesis) => {
		const criteria = `${thesis.title} ${thesis.objectives} ${thesis.requirements}`;
		const classArray: string[] = [];
		const classifications = trainedClassifier.getClassifications(criteria);
		// biome-ignore lint/complexity/noForEach: <explanation>
		classifications.forEach((classPlusProbability) =>
			classArray.push(classPlusProbability.label),
		);

		return {
			...thesis,
			areas: classArray.slice(0, 2),
		} as ThesisWithAreas;
	});

	return classifiedTheses;
};

const uploadTheses = async (theses: string) => {
	const parsedTheses = await htmlParser.getParsedTheses(theses);
	const trainedClassifier =
		await thesesClassifierService.getTrainedClassifier();
	const classifiedTheses = await classifyTheses(
		parsedTheses,
		trainedClassifier,
	);
	thesesRepository.setTheses(classifiedTheses);
};

const getTheses = async () => {
	return thesesRepository.getTheses();
};

export const thesesService = {
	uploadTheses,
	getTheses,
};
