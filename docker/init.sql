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

-- Create Shop Categories
INSERT INTO neiist.categories (id, name) VALUES (1, 'Vestuário');
INSERT INTO neiist.categories (id, name) VALUES (2, 'Stickers');
INSERT INTO neiist.categories (id, name) VALUES (3, 'Merch');


-- Add Sample Products
/*
INSERT INTO neiist.products (id, name, description, price, images, category_id, stock_type, stock_quantity, order_deadline, estimated_delivery, active) VALUES (5, 'SweatShirt', null, 20.00, '{/products/beige0png.jpg,/products/black0png.jpg,/products/blue0png.jpg,/products/green0png.jpg,/products/red0png.jpg}', null, 'on_demand', 0, '2025-09-09 23:00:00.000000 +00:00', '2025-09-17 23:00:00.000000 +00:00', true);
INSERT INTO neiist.products (id, name, description, price, images, category_id, stock_type, stock_quantity, order_deadline, estimated_delivery, active) VALUES (6, 'Sweat Special 2026', '', 22.00, '{/products/blacknew3png.jpg,/products/black0png.jpg}', null, 'limited', 0, '2025-09-23 23:00:00.000000 +00:00', '2025-09-29 23:00:00.000000 +00:00', true);

INSERT INTO neiist.product_variants (id, product_id, sku, images, price_modifier, stock_quantity, active, created_at, updated_at) VALUES (13, 6, null, '{/products/blacknew0png.jpg,/products/blacknew1png.jpg,/products/blacknew2png.jpg,/products/blacknew3png.jpg,/products/blacknew4png.jpg}', 0.00, 6, true, '2025-09-14 20:57:53.584433 +00:00', '2025-09-14 20:57:53.584433 +00:00');
INSERT INTO neiist.product_variants (id, product_id, sku, images, price_modifier, stock_quantity, active, created_at, updated_at) VALUES (14, 6, null, '{/products/blacknew0png.jpg}', 0.00, 16, true, '2025-09-14 20:57:53.588150 +00:00', '2025-09-14 20:57:53.588150 +00:00');
INSERT INTO neiist.product_variants (id, product_id, sku, images, price_modifier, stock_quantity, active, created_at, updated_at) VALUES (15, 6, null, '{/products/blacknew0png.jpg}', 0.00, 3, true, '2025-09-14 20:57:53.589826 +00:00', '2025-09-14 20:57:53.589826 +00:00');
INSERT INTO neiist.product_variants (id, product_id, sku, images, price_modifier, stock_quantity, active, created_at, updated_at) VALUES (16, 6, null, '{/products/blacknew0png.jpg}', 0.00, 1, true, '2025-09-14 20:57:53.591601 +00:00', '2025-09-14 20:57:53.591601 +00:00');
INSERT INTO neiist.product_variants (id, product_id, sku, images, price_modifier, stock_quantity, active, created_at, updated_at) VALUES (7, 5, null, '{/products/beige-0.png,/products/beige-1.png}', 0.00, 2, true, '2025-09-14 19:43:02.821470 +00:00', '2025-09-14 20:59:17.650247 +00:00');
INSERT INTO neiist.product_variants (id, product_id, sku, images, price_modifier, stock_quantity, active, created_at, updated_at) VALUES (8, 5, null, '{/products/beige-0.png,/products/beige-1.png}', 0.00, 6, true, '2025-09-14 19:43:02.846909 +00:00', '2025-09-14 20:59:17.654296 +00:00');
INSERT INTO neiist.product_variants (id, product_id, sku, images, price_modifier, stock_quantity, active, created_at, updated_at) VALUES (9, 5, null, '{/products/beige-3.png,/products/beige-4.png}', 0.00, 3, true, '2025-09-14 19:43:02.869095 +00:00', '2025-09-14 20:59:17.657509 +00:00');
INSERT INTO neiist.product_variants (id, product_id, sku, images, price_modifier, stock_quantity, active, created_at, updated_at) VALUES (10, 5, null, '{/products/green-1.png,/products/green-0.png,/products/green-3.png}', 0.00, 7, true, '2025-09-14 19:43:02.894657 +00:00', '2025-09-14 20:59:17.660780 +00:00');
INSERT INTO neiist.product_variants (id, product_id, sku, images, price_modifier, stock_quantity, active, created_at, updated_at) VALUES (11, 5, null, '{/products/green-3.png,/products/green-2.png,/products/green-0.png}', 0.00, 13, true, '2025-09-14 19:43:02.928384 +00:00', '2025-09-14 20:59:17.666174 +00:00');
INSERT INTO neiist.product_variants (id, product_id, sku, images, price_modifier, stock_quantity, active, created_at, updated_at) VALUES (12, 5, null, '{/products/green-2.png}', 0.00, 2, true, '2025-09-14 19:43:02.963538 +00:00', '2025-09-14 20:59:17.670348 +00:00');

INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (11, 'Tamanho', 'M');
INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (12, 'Tamanho', 'L');
INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (9, 'Tamanho', 'M');
INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (10, 'Cor', 'Verde');
INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (8, 'Cor', 'Bege');
INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (12, 'Cor', 'Verde');
INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (8, 'Tamanho', 'S');
INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (7, 'Cor', 'Bege');
INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (11, 'Cor', 'Verde');
INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (10, 'Tamanho', 'XS');
INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (7, 'Tamanho', 'XS');
INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (9, 'Cor', 'Bege');
INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (13, 'Tamanho', '"XS"');
INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (14, 'Tamanho', '"S"');
INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (15, 'Tamanho', '"M"');
INSERT INTO neiist.product_variant_options (variant_id, option_name, option_value) VALUES (16, 'Tamanho', '"L"');
*/