const htmlParser = require("./htmlParser")
const thesesClassifier = require("./thesesClassifier")
const db = require('../db/thesesQueries')

const uploadTheses = async theses => {
    const parsedTheses = await htmlParser.getParsedTheses(theses)
    const trainedClassifier = await thesesClassifier.getTrainedClassifier()
    const classifiedTheses = await classifyTheses(parsedTheses, trainedClassifier)
    db.setTheses(classifiedTheses)
}

const classifyTheses = async (parsedTheses, trainedClassifier) => {
    const classifiedTheses = parsedTheses.map(thesis => {
        const criteria = thesis.title + " " + thesis.objectives + " " + thesis.requirements
        let classArray = []
        const classifications = trainedClassifier.getClassifications(criteria)
        classifications.forEach(classPlusProbability => classArray.push(classPlusProbability.label))
        thesis.areas = classArray.slice(0, 2)
        return thesis
    })
    return classifiedTheses
}

const getThesisById = async id => {
    const thesis = db.getThesisById(id)
    return thesis
}

const getThesesByAreas = async areas => {
    const theses = db.getThesesByAreas(areas)
    return theses
}

module.exports = {
    uploadTheses: uploadTheses,
    getThesisById: getThesisById,
    getThesesByAreas: getThesesByAreas
}