const htmlParser = require('./htmlParser');
const thesesClassifier = require('./thesesClassifier');
const { thesesDatabase } = require('../database');

const classifyTheses = async (parsedTheses, trainedClassifier) => {
  const classifiedTheses = parsedTheses.map((thesis) => {
    const criteria = `${thesis.title} ${thesis.objectives} ${thesis.requirements}`;
    const classArray = [];
    const classifications = trainedClassifier.getClassifications(criteria);
    classifications.forEach((classPlusProbability) => classArray.push(classPlusProbability.label));
    const thesisWithAreas = thesis;
    thesisWithAreas.areas = classArray.slice(0, 2);
    return thesis;
  });
  return classifiedTheses;
};

const uploadTheses = async (theses) => {
  const parsedTheses = await htmlParser.getParsedTheses(theses);
  const trainedClassifier = await thesesClassifier.getTrainedClassifier();
  const classifiedTheses = await classifyTheses(parsedTheses, trainedClassifier);
  thesesDatabase.setTheses(classifiedTheses);
};

const getThesesByAreas = async (areas) => {
  const theses = thesesDatabase.getThesesByAreas(areas);
  return theses;
};

module.exports = {
  uploadTheses,
  getThesesByAreas,
};
