import natural, { PorterStemmer } from "natural";
const classifier = new natural.BayesClassifier(PorterStemmer, 0.1);
// natural.PorterStemmer.attach();  // FIXME: is this no longer a thing?

const getTrainedClassifier = async () => {
	/*
  This classifier assumes one area of specialization per professor.
  When the classifier is receiving a criteria to proceed to the classification, there is a problem:
  as the professor's names are stemmed and each name is separated,
  it makes the classifier consider David De Matos and Ana Matos as having a similarity,
  thus conficting the classification process.

  Quick-fix:
  - Make professors' names unique (chosen technique)
      or
  - Cross classify using keywords
  */

	const languageInformationTechnologies = [
		"Natural Language Processing",
		"Laboratório de Sistemas de Língua Falada - L2F (INESC-ID Lisboa)",
		"fixed expressions",
		"popular sayings",
		"speech therapy",
		"Nuno_Mamede",
		"Nuno_João_Neves_Mamede",
		"David_Martins_de_Matos",
		"Luísa_Coheur",
		"Alberto_Abad",
	];
	// biome-ignore lint/complexity/noForEach: <explanation>
	languageInformationTechnologies.forEach((string) =>
		classifier.addDocument(string, "lit"),
	);

	const interactionVisualization = [
		"Augmenting Rehabilitation",
		"Virtual Reality",
		"Design",
		"Experience",
		"AR",
		"Flat Design",
		"Sensing",
		"Visualizing",
		"3D",
		"Modelation",
		"hologram",
		"realidade virtual",
		"VR",
		"Gamification",
		"Virtual object",
		"Joaquim_Jorge",
		"Nuno_Nunes",
		"Daniel_Jorge_Viegas_Gonçalves",
		"João_Brisson",
		"Alfredo_Ferreira",
		"Jacinto_Carlos_Marques_Peixoto_do_Nascimento",
		"Hugo_Nicolau",
		"Sandra_Pereira_Gama",
	];
	// biome-ignore lint/complexity/noForEach: <explanation>
	interactionVisualization.forEach((string) =>
		classifier.addDocument(string, "iv"),
	);

	const cyberSecurity = [
		"Password Quality",
		"Bugs",
		"Verification",
		"Verificação",
		"network fault injection",
		"Security",
		"breaking",
		"Smart Contracts",
		"smart card",
		"blockchain",
		"tls",
		"Privacy",
		"forensics",
		"Miguel_Nuno_Dias_Alves_Pupo_Correia",
		"Ricardo_Chaves",
		"Pedro_Adão",
		"Adão",
	];
	// biome-ignore lint/complexity/noForEach: <explanation>
	cyberSecurity.forEach((string) => classifier.addDocument(string, "cs"));

	const algorithmsApplications = [
		"GPU",
		"Smart-Graphs",
		"Constraint Logic",
		"Graph Theory",
		"Quantum computer",
		"Computador quântico",
		"code",
		"José_Monteiro",
		"Inês_Lynce",
		"Vasco_Manquinho",
		"Helena_Sofia_Andrade_Nunes_Pereira_Pinto",
		"António_Paulo_Teles_de_Menezes_Correia_Leitão",
		"Alexandre_Francisco",
		"Luís_Russo",
		"Ana_Almeida_Matos",
		"Jan_Gunnar_Cederquist",
		"Mikolas_Janota",
	];
	// biome-ignore lint/complexity/noForEach: <explanation>
	algorithmsApplications.forEach((string) =>
		classifier.addDocument(string, "aa"),
	);

	const games = [
		"NPC",
		"Digital",
		"g",
		"Gamification",
		"Jogos",
		"tactically",
		"João_Miguel_De_Sousa_de_Assis_Dias",
		"Carlos_António_Roque_Martinho",
		"Rui_Filipe_Fernandes_Prada",
		"Carlos_Martinho",
		"João_Miguel_De_Sousa_de_Assis_Dias",
	];
	// biome-ignore lint/complexity/noForEach: <explanation>
	games.forEach((string) => classifier.addDocument(string, "g"));

	const enterpriseInformationSystems = [
		"Digital Transformation",
		"Enterprise Architecture",
		"Support Services for Digital Operations Transformation",
		"IT Project Management",
		"Business Architecture",
		"COBIT",
		"BPMN",
		"Modeling",
		"Archimate",
		"Startup",
		"Business processes",
		"ontology",
		"ontologia",
		"analysis",
		"Gestão de dados",
		"José_Manuel_Nunes_Salvador_Tribolet",
		"Sérgio_Luís_Proença_Duarte_Guerreiro",
		"Mário_Gaspar_da_Silva",
		"Pedro_Manuel_Moreira_Vaz_Antunes_de_Sousa",
		"José_Borbinha",
		"Alberto_Silva",
		"Miguel_Mira_da_Silva",
		"André_Vasconcelos",
		"Rui_António_Dos_Santos_Cruz",
	];
	// biome-ignore lint/complexity/noForEach: <explanation>
	enterpriseInformationSystems.forEach((string) =>
		classifier.addDocument(string, "eis"),
	);

	const intelligentSystems = [
		"robots",
		"inteligente",
		"intelligent",
		"Machine Learning",
		"Service Support Bots",
		"behavior for robots",
		"Change Detection on Frequent Patterns",
		"Matching",
		"agents",
		"multi agent system",
		"autonomous agents",
		"bot",
		"chatbot",
		"Arlindo_Manuel_Limede_de_Oliveira",
		"Ana_Paiva",
		"Ernesto_Morgado",
		"Francisco_Correia_dos_Santos",
		"Manuel_Cabido_Lopes",
		"Helena_Galhardas",
		"Cláudia_Antunes",
		"Andreas_Miroslaus_Wichert",
		"Diogo_Ribeiro_Ferreira", // More data science
		"Bruno_Emanuel_Da_Graça_Martins",
		"José_Alberto_Rodrigues_Pereira_Sardinha",
		"Francisco_Saraiva_de_Melo",
		"Anna_Carolina_Nametala_Finamore_do_Couto",
	];
	// biome-ignore lint/complexity/noForEach: <explanation>
	intelligentSystems.forEach((string) => classifier.addDocument(string, "is"));

	const distributedCyberphysicalSystems = [
		"IoT",
		"cache",
		"blockchain",
		"Domotic",
		"Internet of Things",
		"Redes",
		"Networks",
		"OpenCL",
		"processor",
		"P3",
		"TCB",
		"Quantum computer",
		"Computador quântico",
		"José_Manuel_da_Costa_Alves_Marques",
		"Luís_Eduardo_Teixeira_Rodrigues",
		"Rui_Policarpo_Duarte",
		"Horácio_Neto",
		"Rodrigo_Rodrigues",
		"José_Monteiro",
		"Paulo_Jorge_Pires_Ferreira",
		"Luís_Veiga",
		"Paolo_Romano",
		"Alberto_Manuel_Ramos_da_Cunha",
		"Renato_Jorge_Caleira_Nunes",
		"Nuno_Santos",
		"Miguel_Filipe_Leitão_Pardal",
		"João_Pedro_Faria_Mendonça_Barreto",
		"Miguel_Matos",
	];
	// biome-ignore lint/complexity/noForEach: <explanation>
	distributedCyberphysicalSystems.forEach((string) =>
		classifier.addDocument(string, "dcs"),
	);

	const bioinformaticsComputationalBiology = [
		"healthcare",
		"Disease",
		"doença",
		"protein",
		"proteina",
		"Medical",
		"médica",
		"Clinical",
		"dados biométricos",
		"Reconhecimento facial",
		"Saúde",
		"Health",
		"Arlindo_Manuel_Limede_de_Oliveira",
		"Rui_Henriques",
	];
	// biome-ignore lint/complexity/noForEach: <explanation>
	bioinformaticsComputationalBiology.forEach((string) =>
		classifier.addDocument(string, "bcb"),
	);

	const softwareEngineering = [
		"microservices architecture",
		"Framework",
		"Virtualization",
		"Dynamic API Invocation",
		"monolithic architecture",
		"Responsive Web Applications",
		"Service Virtualization Framework",
		"Mobile Application",
		"Mobile",
		"App",
		"RESTful Web APIs",
		"António_Rito_Silva",
		"João_Fernando_Ferreira",
		"João_F._Ferreira",
		"Pável_Pereira_Calado",
		"Rui_Maranhão",
		"Pedro_Reis_dos_Santos",
		"António_Paulo_Teles_de_Menezes_Correia_Leitão",
		"João_Carlos_Serrenho_Dias_Pereira",
		"Luís_Guerra_e_Silva",
		"João_Garcia",
		"Pedro_Tiago_Gonçalves_Monteiro",
	];
	// biome-ignore lint/complexity/noForEach: <explanation>
	softwareEngineering.forEach((string) => classifier.addDocument(string, "se"));

	classifier.train();

	return classifier;
};

export const thesesClassifierService = {
	getTrainedClassifier,
};
