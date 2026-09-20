SELECT neiist.add_department('Direção', 'admin_body');

SELECT neiist.add_department('Dev-Team', 'team', jsonb_build_object('pt', 'A Dev-Team é a equipa de colaboradores do NEIIST que está responsável pelo site do núcleo, desde a sua manutenção até à implementação de novas funcionalidades. Os elementos da equipa trabalham tanto no backend como no frontend do site, de modo a melhorar as ferramentas disponíveis no site.', 'en', 'The Dev-Team is responsible for the core NEIIST website and web tools, maintaining infrastructure and developing new features across the full stack.'));

SELECT neiist.add_valid_department_role('Direção', 'Presidente');
SELECT neiist.add_valid_department_role('Direção', 'Vice-Presidente');
SELECT neiist.add_valid_department_role('Dev-Team', 'Coordenador');

-- Admin roles: Direção (Presidente, Vice-Presidente) and Dev-Team (Coordenador) receive all permissions
INSERT INTO neiist.role_permissions (department_name, role_name, permission_name)
SELECT vdr.department_name, vdr.role_name, unnest(enum_range(NULL::neiist.permission_enum))
FROM neiist.valid_department_roles vdr
WHERE (
  (vdr.department_name = 'Direção' AND vdr.role_name IN ('Presidente', 'Vice-Presidente'))
  OR (vdr.department_name = 'Dev-Team' AND vdr.role_name = 'Coordenador')
)
ON CONFLICT (department_name, role_name, permission_name) DO NOTHING;

-- Create Shop Categories
INSERT INTO neiist.categories (id, name) VALUES (1, 'Vestuário') ON CONFLICT DO NOTHING;
INSERT INTO neiist.categories (id, name) VALUES (2, 'Stickers') ON CONFLICT DO NOTHING;
INSERT INTO neiist.categories (id, name) VALUES (3, 'Merch') ON CONFLICT DO NOTHING;
