SELECT neiist.add_admin_body('Direção');
SELECT neiist.add_admin_body('Mesa da Assembleia Geral');
SELECT neiist.add_admin_body('Conselho Fiscal');

SELECT  neiist.add_team('Controlo & Qualidade', 'O trabalho no Controlo & Qualidade consiste na criação e partilha de formulários de forma a obter o feedback dos alunos em relação aos eventos organizados pelo NEIIST. No final de cada evento é elaborado um relatório para avaliar os resultados e para que os colaboradores saibam o que melhorar em eventos seguintes.');
SELECT  neiist.add_team('Contacto', 'O trabalho na equipa de Contacto consiste em estabelecer e desenvolver relações com empresas, de modo a aproximá-las dos estudantes. Nisto está inserido: reunir com empresas para estabelecer os moldes de uma parceria, angariação de patrocínios para eventos do NEIIST, planeamento de eventos em parceria com empresas, angariação de empresas para os IST Summer Internships, entre outros...');
SELECT  neiist.add_team('Dev-Team', 'A Dev-Team é a equipa de colaboradores do NEIIST que está responsável pelo site do núcleo, desde a sua manutenção até à implementação de novas funcionalidades. Os elementos da equipa trabalham tanto no backend como no frontend do site, de modo a melhorar as ferramentas disponíveis no site.');
SELECT  neiist.add_team('Divulgação', 'O trabalho da equipa de Divulgação consiste na coordenação entre a divulgação de todos os eventos organizados pelo NEIIST e de alguns eventos que pedem ao núcleo para divulgar. Os membros desta equipa produzem o texto a seguir para cada evento, divulgando posteriormente pelas redes sociais (ex. Instagram, Facebook e/ou LinkedIn) e pelos grupos (ex. Discord, WhatsApp) de EIC, podendo adaptar-se ao tipo de evento e ao público alvo.');
SELECT  neiist.add_team('Fotografia', 'O trabalho da equipa de Fotografia consiste na cobertura fotográfica e/ou videográfica de eventos organizados pelo NEIIST de modo a expandir a nossa galeria e a mostrar a todos os interessados o trabalho do núcleo. Os membros desta equipa fotografam e/ou filmam os eventos e depois editam o material para ficar pronto para publicação.');
SELECT  neiist.add_team('Organização de Eventos', 'A Organização de Eventos é algo diferente do trabalho nas restantes equipas, pode variar bastante de evento para evento, mas inclui sempre tratar da logística, falar com possíveis oradores e/ou outros intervenientes na organização do evento (talvez até falar com possíveis patrocinadores, se for esse o caso) e fazer a ponte com as outras equipas do NEIIST envolvidas no evento.');
SELECT  neiist.add_team('Visuais', 'O trabalho da equipa de Visuais consiste na criação de cartazes, banners, panfletos e outros materiais visuais para ajudar à divulgação de eventos organizados pelo NEIIST, para garantir que estes chegam ao maior número possível de alunos. Os membros da equipa produzem o material pedido e recebem feedback da equipa, antes de o enviar para os organizadores do evento que pedem as alterações necessárias, se for esse o caso.');

SELECT neiist.add_valid_department_role('Direção', 'Presidente', 'admin');
SELECT neiist.add_valid_department_role('Direção', 'Vice-Presidente', 'admin');
SELECT neiist.add_valid_department_role('Direção', 'Vogal', 'admin');
SELECT neiist.add_valid_department_role('Direção', 'Diretora de Atividades (Alameda)', 'member');
SELECT neiist.add_valid_department_role('Direção', 'Diretor de Atividades (Taguspark)', 'member');
SELECT neiist.add_valid_department_role('Direção', 'Diretora SINFO', 'member');
SELECT neiist.add_valid_department_role('Direção', 'Tesoureiro', 'member');

SELECT neiist.add_valid_department_role('Mesa da Assembleia Geral', 'Presidente', 'admin');
SELECT neiist.add_valid_department_role('Mesa da Assembleia Geral', 'Vice-Presidente', 'coordinator');
SELECT neiist.add_valid_department_role('Mesa da Assembleia Geral', 'Secretário', 'member');

SELECT neiist.add_valid_department_role('Conselho Fiscal', 'Presidente', 'coordinator');
SELECT neiist.add_valid_department_role('Conselho Fiscal', 'Membro', 'member');

SELECT neiist.add_valid_department_role('Controlo & Qualidade', 'Membro', 'member');
SELECT neiist.add_valid_department_role('Controlo & Qualidade', 'Membro', 'member');

SELECT neiist.add_valid_department_role('Contacto', 'Cordenador', 'coordinator');
SELECT neiist.add_valid_department_role('Contacto', 'Membro', 'member');

SELECT neiist.add_valid_department_role('Dev-Team', 'Cordenador', 'admin');
SELECT neiist.add_valid_department_role('Dev-Team', 'Membro', 'member');

SELECT neiist.add_valid_department_role('Divulgação', 'Cordenador', 'coordinator');
SELECT neiist.add_valid_department_role('Divulgação', 'Membro', 'member');

SELECT neiist.add_valid_department_role('Fotografia', 'Cordenador', 'coordinator');
SELECT neiist.add_valid_department_role('Fotografia', 'Membro', 'member');

SELECT neiist.add_valid_department_role('Organização de Eventos', 'Cordenador', 'coordinator');
SELECT neiist.add_valid_department_role('Organização de Eventos', 'Membro', 'member');

SELECT neiist.add_valid_department_role('Visuais', 'Cordenador', 'coordinator');
SELECT neiist.add_valid_department_role('Visuais', 'Membro', 'member');

//Change before use DEV or PROD-first deployment
SELECT neiist.add_user('istID', 'FullName', 'tecnicoEmail', Null, Null, Null, '{Engenharia Informática e de Computadores - Taguspark}');
SELECT neiist.add_user('istID', 'FullName', 'tecnicoEmail', Null, Null, Null, '{Engenharia Informática e de Computadores - Taguspark}');

SELECT neiist.add_team_member('istID', 'Direção', 'Vice-Presidente');
SELECT neiist.add_team_member('istID', 'Dev-Team', 'Cordenador');
