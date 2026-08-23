import { Client } from "pg";
import readline from "node:readline/promises";

const inputReadline = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const adminConnString = "postgresql://admin:admin@localhost:5432/neiist";

async function seedInitialData(client: Client) {
  console.log("Seeding default organization bodies, teams, and categories...");

  // Admin Bodies
  await client.query(`
    SELECT neiist.add_admin_body('Direção');
    SELECT neiist.add_admin_body('Mesa da Assembleia Geral');
    SELECT neiist.add_admin_body('Conselho Fiscal');
  `);

  // Teams
  await client.query(`
    SELECT neiist.add_team('Controlo & Qualidade', 'O trabalho no Controlo & Qualidade consiste na criação e partilha de formulários de forma a obter o feedback dos alunos em relação aos eventos organizados pelo NEIIST. No final de cada evento é elaborado um relatório para avaliar os resultados e para que os colaboradores saibam o que melhorar em eventos seguintes.');
    SELECT neiist.add_team('Contacto', 'O trabalho na equipa de Contacto consiste em estabelecer e desenvolver relações com empresas, de modo a aproximá-las dos estudantes. Nisto está inserido: reunir com empresas para estabelecer os moldes de uma parceria, angariação de patrocínios para eventos do NEIIST, planeamento de eventos em parceria com empresas, angariação de empresas para os IST Summer Internships, entre outros...');
    SELECT neiist.add_team('Dev-Team', 'A Dev-Team é a equipa de colaboradores do NEIIST que está responsável pelo site do núcleo, desde a sua manutenção até à implementação de novas funcionalidades. Os elementos da equipa trabalham tanto no backend como no frontend do site, de modo a melhorar as ferramentas disponíveis no site.');
    SELECT neiist.add_team('Divulgação', 'O trabalho da equipa de Divulgação consiste na coordenação entre a divulgação de todos os eventos organizados pelo NEIIST e de alguns eventos que pedem ao núcleo para divulgar. Os membros desta equipa produzem o texto a seguir para cada evento, divulgando posteriormente pelas redes sociais (ex. Instagram, Facebook e/ou LinkedIn) e pelos grupos (ex. Discord, WhatsApp) de EIC, podendo adaptar-se ao tipo de evento e ao público alvo.');
    SELECT neiist.add_team('Fotografia', 'O trabalho da equipa de Fotografia consiste na cobertura fotográfica e/ou videográfica de eventos organizados pelo NEIIST de modo a expandir a nossa galeria e a mostrar a todos os interessados o trabalho do núcleo. Os membros desta equipa fotografam e/ou filmam os eventos e depois editam o material para ficar pronto para publicação.');
    SELECT neiist.add_team('Organização de Eventos', 'A Organização de Eventos é algo diferente do trabalho nas restantes equipas, pode variar bastante de evento para evento, mas inclui sempre tratar da logística, falar com possíveis oradores e/ou outros intervenientes na organização do evento (talvez até falar com possíveis patrocinadores, se for esse o caso) e fazer a ponte com as outras equipas do NEIIST envolvidas no evento.');
    SELECT neiist.add_team('Visuais', 'O trabalho da equipa de Visuais consiste na criação de cartazes, banners, panfletos e outros materiais visuais para ajudar à divulgação de eventos organizados pelo NEIIST, para garantir que estes chegam ao maior número possível de alunos. Os membros da equipa produzem o material pedido e recebem feedback da equipa, antes de o enviar para os organizadores do evento que pedem as alterações necessárias, se for esse o caso.');
  `);

  // Department Roles
  await client.query(`
    SELECT neiist.add_valid_department_role('Direção', 'Presidente', 'admin');
    SELECT neiist.add_valid_department_role('Direção', 'Vice-Presidente', 'admin');
    SELECT neiist.add_valid_department_role('Direção', 'Vogal', 'admin');
    SELECT neiist.add_valid_department_role('Direção', 'Diretora de Atividades (Alameda)', 'coordinator');
    SELECT neiist.add_valid_department_role('Direção', 'Diretor de Atividades (Taguspark)', 'coordinator');
    SELECT neiist.add_valid_department_role('Direção', 'Diretora SINFO', 'member');
    SELECT neiist.add_valid_department_role('Direção', 'Tesoureiro', 'member');

    SELECT neiist.add_valid_department_role('Mesa da Assembleia Geral', 'Presidente', 'admin');
    SELECT neiist.add_valid_department_role('Mesa da Assembleia Geral', 'Vice-Presidente', 'coordinator');
    SELECT neiist.add_valid_department_role('Mesa da Assembleia Geral', 'Secretário', 'member');

    SELECT neiist.add_valid_department_role('Conselho Fiscal', 'Presidente', 'coordinator');
    SELECT neiist.add_valid_department_role('Conselho Fiscal', 'Membro', 'member');

    SELECT neiist.add_valid_department_role('Controlo & Qualidade', 'Coordenador', 'coordinator');
    SELECT neiist.add_valid_department_role('Controlo & Qualidade', 'Membro', 'member');

    SELECT neiist.add_valid_department_role('Contacto', 'Coordenador', 'coordinator');
    SELECT neiist.add_valid_department_role('Contacto', 'Membro', 'member');

    SELECT neiist.add_valid_department_role('Dev-Team', 'Coordenador', 'admin');
    SELECT neiist.add_valid_department_role('Dev-Team', 'Membro', 'member');

    SELECT neiist.add_valid_department_role('Divulgação', 'Coordenador', 'coordinator');
    SELECT neiist.add_valid_department_role('Divulgação', 'Membro', 'member');

    SELECT neiist.add_valid_department_role('Fotografia', 'Coordenador', 'coordinator');
    SELECT neiist.add_valid_department_role('Fotografia', 'Membro', 'member');

    SELECT neiist.add_valid_department_role('Organização de Eventos', 'Coordenador', 'coordinator');
    SELECT neiist.add_valid_department_role('Organização de Eventos', 'Membro', 'member');

    SELECT neiist.add_valid_department_role('Visuais', 'Coordenador', 'coordinator');
    SELECT neiist.add_valid_department_role('Visuais', 'Membro', 'member');
  `);

  // Categories
  await client.query(`
    INSERT INTO neiist.categories (id, name) VALUES (1, 'Vestuário') ON CONFLICT DO NOTHING;
    INSERT INTO neiist.categories (id, name) VALUES (2, 'Stickers') ON CONFLICT DO NOTHING;
    INSERT INTO neiist.categories (id, name) VALUES (3, 'Merch') ON CONFLICT DO NOTHING;
  `);

  console.log("Default organization data seeded.");
}

async function run() {
  const client = new Client({
    connectionString: adminConnString,
  });

  try {
    await client.connect();
    await seedInitialData(client);

    console.log("\nConfigure Dev Admin for local development:");
    const dev_istid = await inputReadline.question("ISTID (e.g. ist1999999): ");
    const dev_name = await inputReadline.question("Name (e.g. John Doe): ");
    const dev_email = await inputReadline.question("Email (e.g. john.doe@tecnico.ulisboa.pt): ");
    inputReadline.close();

    if (dev_istid && dev_name && dev_email) {
      await client.query(
        `SELECT neiist.add_user($1, $2, $3, Null, Null, Null, '{Engenharia Informática e de Computadores - Taguspark}', NULL, NULL);`,
        [dev_istid, dev_name, dev_email]
      );

      await client.query(`SELECT neiist.add_team_member($1, 'Dev-Team', 'Coordenador');`, [
        dev_istid,
      ]);

      console.log("Dev admin user seeded successfully.");
    }
  } catch (err) {
    console.error("Failed to seed database:", err);
  } finally {
    await client.end();
  }
}

void run();
