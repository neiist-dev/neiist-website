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

  // Departments (Admin Bodies & Teams)
  await client.query(`
    SELECT neiist.add_department('Direção', 'admin_body');
    SELECT neiist.add_department('Mesa da Assembleia Geral', 'admin_body');
    SELECT neiist.add_department('Conselho Fiscal', 'admin_body');

    SELECT neiist.add_department('Controlo & Qualidade', 'team', jsonb_build_object('pt', 'O trabalho no Controlo & Qualidade consiste na criação e partilha de formulários de forma a obter o feedback dos alunos em relação aos eventos organizados pelo NEIIST. No final de cada evento é elaborado um relatório para avaliar os resultados e para que os colaboradores saibam o que melhorar em eventos seguintes.', 'en', 'Quality Control work consists of creating and sharing feedback forms for events organized by NEIIST. At the end of each event, a report is compiled to evaluate results and provide feedback for upcoming initiatives.'));
    SELECT neiist.add_department('Contacto', 'team', jsonb_build_object('pt', 'O trabalho na equipa de Contacto consiste em estabelecer e desenvolver relações com empresas, de modo a aproximá-las dos estudantes. Nisto está inserido: reunir com empresas para estabelecer os moldes de uma parceria, angariação de patrocínios para eventos do NEIIST, planeamento de eventos em parceria com empresas, angariação de empresas para os IST Summer Internships, entre outros...', 'en', 'The Contact team focuses on establishing and fostering relationships between companies and students, including partnering for events, securing sponsorships, and organizing company involvement in IST Summer Internships.'));
    SELECT neiist.add_department('Dev-Team', 'team', jsonb_build_object('pt', 'A Dev-Team é a equipa de colaboradores do NEIIST que está responsável pelo site do núcleo, desde a sua manutenção até à implementação de novas funcionalidades. Os elementos da equipa trabalham tanto no backend como no frontend do site, de modo a melhorar as ferramentas disponíveis no site.', 'en', 'The Dev-Team is responsible for the core NEIIST website and web tools, maintaining infrastructure and developing new features across the full stack.'));
    SELECT neiist.add_department('Divulgação', 'team', jsonb_build_object('pt', 'O trabalho da equipa de Divulgação consiste na coordenação entre a divulgação de todos os eventos organizados pelo NEIIST e de alguns eventos que pedem ao núcleo para divulgar. Os membros desta equipa produzem o texto a seguir para cada evento, divulgando posteriormente pelas redes sociais (ex. Instagram, Facebook e/ou LinkedIn) e pelos grupos (ex. Discord, WhatsApp) de EIC, podendo adaptar-se ao tipo de evento e ao público alvo.', 'en', 'The Communications team coordinates social media and community messaging for all events and announcements organized or supported by NEIIST.'));
    SELECT neiist.add_department('Fotografia', 'team', jsonb_build_object('pt', 'O trabalho da equipa de Fotografia consiste na cobertura fotográfica e/ou videográfica de eventos organizados pelo NEIIST de modo a expandir a nossa galeria e a mostrar a todos os interessados o trabalho do núcleo. Os membros desta equipa fotografam e/ou filmam os eventos e depois editam o material para ficar pronto para publicação.', 'en', 'The Photography team provides photo and video coverage of NEIIST events to document activities and celebrate student life.'));
    SELECT neiist.add_department('Organização de Eventos', 'team', jsonb_build_object('pt', 'A Organização de Eventos é algo diferente do trabalho nas restantes equipas, pode variar bastante de evento para evento, mas inclui sempre tratar da logística, falar com possíveis oradores e/ou outros intervenientes na organização do evento (talvez até falar com possíveis patrocinadores, se for esse o caso) e fazer a ponte com as outras equipas do NEIIST envolvidas no evento.', 'en', 'The Event Organization team handles event logistics, speakers, and venue coordination for major workshops, hackathons, and social events.'));
    SELECT neiist.add_department('Visuais', 'team', jsonb_build_object('pt', 'O trabalho da equipa de Visuais consiste na criação de cartazes, banners, panfletos e outros materiais visuais para ajudar à divulgação de eventos organizados pelo NEIIST, para garantir que estes chegam ao maior número possível de alunos. Os membros da equipa produzem o material pedido e recebem feedback da equipa, antes de o enviar para os organizadores do evento que pedem as alterações necessárias, se for esse o caso.', 'en', 'The Visuals team crafts graphic identities, posters, banners, and visual assets to promote all student branch activities.'));
  `);

  // Department Roles (no access argument)
  await client.query(`
    SELECT neiist.add_valid_department_role('Direção', 'Presidente');
    SELECT neiist.add_valid_department_role('Direção', 'Vice-Presidente');
    SELECT neiist.add_valid_department_role('Dev-Team', 'Coordenador');
  `);

  // Categories
  await client.query(`
    INSERT INTO neiist.categories (id, name) VALUES (1, 'Vestuário') ON CONFLICT DO NOTHING;
    INSERT INTO neiist.categories (id, name) VALUES (2, 'Stickers') ON CONFLICT DO NOTHING;
    INSERT INTO neiist.categories (id, name) VALUES (3, 'Merch') ON CONFLICT DO NOTHING;
  `);

  // Role Permissions for Admin roles
  await client.query(`
    -- Admin roles: Direção (Presidente, Vice-Presidente) and Dev-Team (Coordenador) receive all permissions
    INSERT INTO neiist.role_permissions (department_name, role_name, permission_name)
    SELECT vdr.department_name, vdr.role_name, unnest(enum_range(NULL::neiist.permission_enum))
    FROM neiist.valid_department_roles vdr
    WHERE (
      (vdr.department_name = 'Direção' AND vdr.role_name IN ('Presidente', 'Vice-Presidente'))
      OR (vdr.department_name = 'Dev-Team' AND vdr.role_name = 'Coordenador')
    )
    ON CONFLICT (department_name, role_name, permission_name) DO NOTHING;
  `);

  console.log("Default organization data and permissions seeded.");
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

      await client.query(`SELECT neiist.add_membership($1, 'Dev-Team', 'Coordenador');`, [
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
