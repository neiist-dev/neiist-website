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

SELECT neiist.add_valid_department_role('Controlo & Qualidade', 'Cordenador', 'coordinator');
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
SELECT neiist.add_user('ist1109686', 'Miguel Póvoa Raposo', 'miguel.p.raposo@tecnico.ulisboa.pt', Null, Null, Null, '{Engenharia Informática e de Computadores - Taguspark}');
SELECT neiist.add_user('ist1110632', 'Inês Isabel Santos Costa', 'inesiscosta@tecnico.ulisboa.pt', Null, Null, Null, '{Engenharia Informática e de Computadores - Taguspark}');

SELECT neiist.add_team_member('istID', 'Direção', 'Vice-Presidente');
SELECT neiist.add_team_member('istID', 'Dev-Team', 'Cordenador');

-- Add base Activities
SELECT neiist.add_event('Advent of Code', 'O Advent Of Code é um evento que lança desafios diários de programação, desde o dia 1 de dezembro até ao Natal. Estes desafios podem ser resolvidos na linguagem de programação que preferires! Quem obtiver mais pontos no final do evento, ganha!', 'aoc.jpg');
SELECT neiist.add_event('Torneio de E-Sports', 'Gostas de jogar? Que coincidência, este evento foi mesmo feito a pensar em ti! Reúne uma equipa e vem passar o dia connosco a jogar, comer e beber... e quem sabe ganhar um prémio ou outro!', 'esports.jpg');
SELECT neiist.add_event('Sweats EIC', 'E o que achas de teres uma sweat com o nome do teu curso? Não te esqueças, o NEIIST dá-te a oportunidade de teres a sweat do melhor curso!', 'sweats.jpg');
SELECT neiist.add_event('Concurso de Layout de Sweats', 'O Concurso de Layout de Sweats é a tua oportunidade de criar o layout oficial para a edição especial de cada ano. Se és estudante de EIC do IST podes submeter até 3 designs originais. Se ganhares a votação online, ganhas a sweat!', 'layout.jpg');
SELECT neiist.add_event('Churrasco EIC', 'Mesmo que fosse uma semana de projetos ou exames, haveria sempre tempo para um convívio com amigos!', 'churras.jpg');
SELECT neiist.add_event('Jantar de Curso', 'Muito stressado com o Técnico? Nós também, junta-te aos teus colegas no melhor jantar de curso!  A cerveja já está a tua espera…', 'jantar_curso.jpg');
SELECT neiist.add_event('Let''s Talk about LEIC', 'Acabaste de chegar ao curso e sentes-te perdido? Vem aprender connosco todos os truques para sobreviveres! Com este evento, junto dos alunos mais velhos, vais compreender como funciona LEIC e as suas disciplinas.', 'ltal.jpg');
SELECT neiist.add_event('(Quase) Tudo Sobre MEIC', 'Vais entrar em MEIC? Se estás indeciso sobre quais áreas ou cadeiras escolher, vem assistir a estas sessões! Irão explicar-te tudo o que precisas saber sobre a estrutura do mestrado, o currículo, as diferentes áreas de especialização, a tese e muito mais.', 'qtsm.jpg');
SELECT neiist.add_event('Workshop de Python', 'Estás preocupado com o projeto de FP ou queres aprender mais sobre Python? Vem a este workshop onde vamos falar das principais bases da programação e ensinar-te os primeiros passos essenciais para o mundo informático!', 'python.jpg');
SELECT neiist.add_event('Workshop Assembly', 'Não sabes o que quer dizer MOV, ADD, CMP? Não sabes o que são registos e flags? Então junta-te a nós neste workshop onde te ensinamos as bases de Assembly que irão ser fundamentais em IAC!', 'assembly.jpg');
SELECT neiist.add_event('Workshop C', 'Queres finalmente perceber o que é alocação de memória, o que são ponteiros, como funciona a pilha e muito mais? Junta-te a nós neste workshop e tira todas as tuas dúvidas!', 'C.jpg');
SELECT neiist.add_event('Hash Code', 'Junta-te a nós na competição de código desenvolvida pela Google na qual o NEIIST organiza uma Hub onde todos os alunos do técnico são bem-vindos a integrar e participar.', 'hashcode.jpg');
SELECT neiist.add_event('Linux Install Party', 'Vem instalar o Linux no teu PC, junto a alunos com experiência na área e na instalação dos vários flavors que o Linux tem para oferecer!', 'lip.jpg');

-- Add Sample products to the shop for testing in prod use real products
DO $$
DECLARE
  p_tshirt INTEGER;
  p_sticker INTEGER;
  p_sweat INTEGER;

  v_tshirt_m INTEGER;
  v_tshirt_l INTEGER;
  v_sweat_m INTEGER;
  v_sweat_l INTEGER;

  o1 INTEGER;
  o2 INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.users WHERE istid = 'ist1109686') THEN
    PERFORM 1 FROM neiist.add_user(
      'ist1109686',
      'Miguel Póvoa Raposo',
      'miguel.p.raposo@tecnico.ulisboa.pt',
      NULL,
      NULL,
      NULL,
      ARRAY['Engenharia Informática e de Computadores - Taguspark']
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM neiist.users WHERE istid = 'ist1110632') THEN
    PERFORM 1 FROM neiist.add_user(
      'ist1110632',
      'Inês Costa',
      'inesiscosta@tecnico.ulisboa.pt',
      NULL,
      NULL,
      NULL,
      ARRAY['Engenharia Informática e de Computadores - Taguspark']
    );
  END IF;

  SELECT id INTO p_tshirt FROM neiist.add_product(
    'T-shirt NEIIST',
    'Camisola oficial do núcleo.',
    12.00,
    ARRAY['/products/green-0.png','/products/green-1.png'],
    'Vestuário',
    'limited',
    50,
    '2025-09-01',
    '2025-09-15',
    TRUE
  );

  PERFORM neiist.add_product_variant(
    p_tshirt,
    'Tamanho',
    'M',
    ARRAY['/products/green-1.png'],
    0.00,
    20,
    'M',
    TRUE
  );
  PERFORM neiist.add_product_variant(
    p_tshirt,
    'Tamanho',
    'L',
    ARRAY['/products/green-2.png'],
    0.00,
    30,
    'L',
    TRUE
  );

  SELECT id INTO v_tshirt_m FROM neiist.product_variants
    WHERE product_id = p_tshirt AND variant_name='Tamanho' AND variant_value='M';
  SELECT id INTO v_tshirt_l FROM neiist.product_variants
    WHERE product_id = p_tshirt AND variant_name='Tamanho' AND variant_value='L';

  SELECT id INTO p_sticker FROM neiist.add_product(
    'Sticker NEIIST',
    'Autocolante para portátil.',
    2.00,
    ARRAY['/products/green-4.png'],
    'Merch',
    'on_demand',
    NULL,
    '2025-09-10',
    '2025-09-25',
    TRUE
  );

  SELECT id INTO p_sweat FROM neiist.add_product(
    'Sweat NEIIST',
    'Sweat confortável para os dias frios.',
    25.00,
    ARRAY['/products/green-0.png','/products/green-3.png'],
    'Vestuário',
    'limited',
    15,
    '2025-09-01',
    '2025-09-20',
    TRUE
  );

  PERFORM neiist.add_product_variant(
    p_sweat,
    'Tamanho',
    'M',
    ARRAY['/products/green-3.png'],
    0.00,
    7,
    'M',
    TRUE
  );
  PERFORM neiist.add_product_variant(
    p_sweat,
    'Tamanho',
    'L',
    ARRAY['/products/green-3.png'],
    0.00,
    8,
    'L',
    TRUE
  );

  SELECT id INTO v_sweat_m FROM neiist.product_variants
    WHERE product_id = p_sweat AND variant_name='Tamanho' AND variant_value='M';
  SELECT id INTO v_sweat_l FROM neiist.product_variants
    WHERE product_id = p_sweat AND variant_name='Tamanho' AND variant_value='L';

  SELECT id INTO o1 FROM neiist.new_order(
    'ist1109686',
    '123456789',
    'TagusPark',
    'Entregar na sala do núcleo.',
    'MBWay',
    'MBW123456',
    jsonb_build_array(
      jsonb_build_object('product_id', p_tshirt, 'variant_id', v_tshirt_m, 'quantity', 2),
      jsonb_build_object('product_id', p_sticker, 'variant_id', NULL, 'quantity', 5)
    )
  );

  PERFORM 1 FROM neiist.set_order_state(o1, 'paid', 'Miguel Póvoa Raposo');
  PERFORM 1 FROM neiist.set_order_state(o1, 'delivered', 'Francisca Almeida');

  SELECT id INTO o2 FROM neiist.new_order(
    'ist1110632',
    NULL,
    'TagusPark',
    NULL,
    'Dinheiro',
    NULL,
    jsonb_build_array(
      jsonb_build_object('product_id', p_sweat, 'variant_id', v_sweat_l, 'quantity', 1)
    )
  );
END;
$$;
