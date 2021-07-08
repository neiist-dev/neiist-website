let htmlparser = require("htmlparser2")

const getParsedTheses = async theses => {
  try {
    let handler = new htmlparser.DomHandler(function (error, dom) {
      if (error) throw new Error(error)
      /*
      * Instructions:
      * Get a file with thesis on ESTUDANTE -> Candidatura a Dissertação -> Available Proposals
      * Delete everything above the theses' beggining on <tbody>. Delete everything after </tbody>
      * */
      let tableBody = dom[1]

      tableBody.children.forEach((element) => {
        if (element.type === "tag" && element.name === "tr") {

          let oneThesis = {
            id: "",
            title: "",
            supervisors: "",
            vacancies: "",
            location: "",
            courses: "",
            observations: "",
            objectives: "",
            status: "",
            requirements: "",
            areas: "",
            type: ""
          }

          //contém os td's com info
          let trChild = element.children

          //We have td's in iterations 1,3,5,7,9,11
          let i = 0
          //Entre texto (espaços) e tds, trChild tem 13 elementos
          //há 6 td's, alguns com info nested
          trChild.forEach((subelement) => {
            if (subelement.type === "tag" && subelement.name === "td") {
              if (i === 1) oneThesis.id = subelement.children[0].data
              if (i === 3) oneThesis.title = subelement.children[0].data
              if (i === 5) {
                let elementsNumber = subelement.children.length
                let arraySupervisors = []
                for (let j = 1; j < elementsNumber; j = j + 2)
                  arraySupervisors.push(subelement.children[j].children[0].data);
                oneThesis.supervisors = arraySupervisors
              }
              if (i === 7) oneThesis.vacancies = subelement.children[0].data
              if (i === 9) {
                let status = subelement.children[1].children[0].data;
                if (status === "Not assigned")
                  status = "Unassigned";
                oneThesis.status = status;
              }
              if (i === 11) {
                //TODO: Impact of \n and \t at FE. Remove?
                let info = subelement.children[1].children[3].children[5];

                let observations = info.attribs["data-observations"];
                if (observations)
                  observations = observations.replace("\t", ": ");
                oneThesis.observations = observations;

                let requirements = info.attribs["data-requirements"];
                if (requirements) {
                  requirements = requirements.replace("\t", ": ");
                  requirements = requirements.replace("\n", "");
                }
                oneThesis.requirements = requirements;
                oneThesis.objectives = info.attribs["data-goals"]
                oneThesis.location = info.attribs["data-localization"]
                oneThesis.courses = info.attribs["data-degrees"]
              }
            }
            //Last iteration, push thesis to array.
            if (i === 12) parsedTheses.push(oneThesis)
            i++
          })
        }
      })
    }, { normalizeWhitespace: true, withStartIndices: true })

    let parsedTheses = []

    let parser = new htmlparser.Parser(handler)
    parser.write(theses)
    parser.end()

    return parsedTheses

  } catch (e) {
    throw new Error(e)
  }
}

module.exports = {
  getParsedTheses: getParsedTheses
}