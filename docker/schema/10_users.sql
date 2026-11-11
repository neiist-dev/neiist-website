-- Users domain
-- Depends on: 00_core

-- ===== TYPES =====

CREATE TYPE neiist.permission_enum AS ENUM (
  'users:read',
  'users:write',
  'users:delete',
  'departments:read',
  'departments:write',
  'departments:delete',
  'roles:read',
  'roles:write',
  'roles:delete',
  'memberships:read',
  'memberships:write_global',
  'memberships:write_dept',
  'memberships:delete',
  'photos:write_global',
  'photos:write_dept',
  'shop:read',
  'shop:write',
  'orders:read',
  'orders:read_customer',
  'orders:create',
  'orders:write',
  'orders:deliver',
  'orders:delete',
  'orders:override',
  'pos:access',
  'pos:manage',
  'voting:read',
  'voting:write',
  'events:read',
  'events:write',
  'events:delete',
  'events:checkin'
);

CREATE TYPE neiist.access_label_enum AS ENUM (
  'admin',
  'coordinator'
);

CREATE TYPE neiist.contact_method_enum AS ENUM (
  'email',
  'alt_email',
  'phone'
);

-- ===== TABLES =====

-- USERS TABLE
CREATE TABLE neiist.users (
  istid VARCHAR(10) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  neiist_email TEXT UNIQUE,
  outlook_calendar_sync BOOLEAN NOT NULL DEFAULT FALSE,
  github TEXT,
  linkedin TEXT
);

-- COURSES TABLE
CREATE TABLE neiist.user_courses (
  user_istid VARCHAR(10) REFERENCES neiist.users(istid),
  course_name TEXT,
  PRIMARY KEY (user_istid, course_name)
);

-- CONTACTS TABLE
CREATE TABLE neiist.user_contacts (
  user_istid VARCHAR(10) REFERENCES neiist.users(istid),
  contact_type neiist.contact_method_enum,
  contact_value TEXT NOT NULL,
  is_preferred BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_istid, contact_type),
  CONSTRAINT valid_contact_value CHECK (
    CASE contact_type
      WHEN 'email' THEN contact_value ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
      WHEN 'alt_email' THEN contact_value ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
      WHEN 'phone' THEN contact_value ~ '^\+?[0-9\s\-\(\)]{7,20}$'
      ELSE TRUE
    END
  )
);

-- EMAIL TOKEN VERIFICATION
CREATE TABLE neiist.email_token (
  id SERIAL PRIMARY KEY,
  istid VARCHAR(10) NOT NULL REFERENCES neiist.users(istid),
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- DEPARTMENTS TABLE
CREATE TABLE neiist.departments (
  name TEXT PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  department_type TEXT CHECK (department_type IN ('team', 'admin_body')),
  display_order INTEGER NOT NULL DEFAULT 999
);

-- TEAMS TABLE
CREATE TABLE neiist.teams (
  name TEXT PRIMARY KEY REFERENCES neiist.departments(name),
  description JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ADMINISTRATION BODIES TABLE
CREATE TABLE neiist.admin_bodies (
  name TEXT PRIMARY KEY REFERENCES neiist.departments(name)
);

-- VALID (DEPARTMENT | ROLE) COMBINATIONS TABLE
CREATE TABLE neiist.valid_department_roles (
  department_name TEXT REFERENCES neiist.departments(name) ON UPDATE CASCADE ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  access_label neiist.access_label_enum DEFAULT NULL,
  PRIMARY KEY (department_name, role_name),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ROLE PERMISSIONS JUNCTION TABLE
CREATE TABLE IF NOT EXISTS neiist.role_permissions (
  department_name TEXT NOT NULL,
  role_name TEXT NOT NULL,
  permission_name neiist.permission_enum NOT NULL,
  FOREIGN KEY (department_name, role_name)
    REFERENCES neiist.valid_department_roles(department_name, role_name) ON DELETE CASCADE,
  PRIMARY KEY (department_name, role_name, permission_name)
);

-- MEMBERSHIP TABLE
CREATE TABLE neiist.membership (
  user_istid VARCHAR(10) REFERENCES neiist.users(istid),
  department_name TEXT NOT NULL,
  role_name TEXT NOT NULL,
  from_date DATE NOT NULL DEFAULT CURRENT_DATE,
  to_date DATE DEFAULT NULL,
  FOREIGN KEY (department_name, role_name)
    REFERENCES neiist.valid_department_roles(department_name, role_name),
  CONSTRAINT valid_member_dates CHECK (to_date IS NULL OR to_date > from_date),
  PRIMARY KEY (user_istid, department_name, role_name, from_date)
);

-- DEPARTMENT MEMBERS HIERARCHY
CREATE TABLE IF NOT EXISTS neiist.department_role_order (
    id SERIAL PRIMARY KEY,
    department_name TEXT NOT NULL REFERENCES neiist.departments(name),
    role_name TEXT NOT NULL,
    position INTEGER NOT NULL,
    CONSTRAINT fk_valid_role FOREIGN KEY (department_name, role_name)
      REFERENCES neiist.valid_department_roles(department_name, role_name),
    UNIQUE (department_name, role_name)
);

-- ===== INDEXES =====

-- Ensure only one preferred contact per user
CREATE UNIQUE INDEX idx_user_preferred_contact
ON neiist.user_contacts (user_istid, is_preferred)
WHERE is_preferred = TRUE;

-- Ensure performance to calculate the access level of a user
CREATE INDEX IF NOT EXISTS idx_membership_active ON neiist.membership (user_istid, to_date)
WHERE to_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_membership_to_date ON neiist.membership (to_date)
WHERE to_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_membership_dates ON neiist.membership (from_date, to_date);

-- ===== FUNCTIONS =====

-- Get user
CREATE OR REPLACE FUNCTION neiist.get_user(
  u_istid VARCHAR(10)
) RETURNS TABLE (
  istid VARCHAR(10),
  name TEXT,
  email TEXT,
  alt_email TEXT,
  neiist_email TEXT,
  outlook_calendar_sync BOOLEAN,
  phone TEXT,
  preferred_contact_method TEXT,
  courses TEXT[],
  permissions TEXT[],
  access_label TEXT,
  teams TEXT[],
  github TEXT,
  linkedin TEXT,
  department_permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.istid,
    u.name,
    u.email,
    (SELECT contact_value FROM neiist.user_contacts WHERE user_istid = u.istid AND contact_type = 'alt_email' LIMIT 1) AS alt_email,
    u.neiist_email,
    u.outlook_calendar_sync,
    (SELECT contact_value FROM neiist.user_contacts WHERE user_istid = u.istid AND contact_type = 'phone' LIMIT 1) AS phone,
    (SELECT contact_type::TEXT FROM neiist.user_contacts WHERE user_istid = u.istid AND is_preferred = TRUE LIMIT 1) AS preferred_contact_method,
    ARRAY(SELECT course_name FROM neiist.user_courses WHERE user_istid = u.istid) AS courses,
    COALESCE(derived_permissions.permissions_array, ARRAY[]::TEXT[]) AS permissions,
    derived_label.top_label::TEXT AS access_label,
    COALESCE(team_list.team_array, ARRAY[]::TEXT[]) AS teams,
    u.github,
    u.linkedin,
    COALESCE(dept_perms.dept_perms_obj, '{}'::JSONB) AS department_permissions
  FROM neiist.users u
  LEFT JOIN (
    SELECT
      m.user_istid,
      array_agg(DISTINCT rp.permission_name::TEXT)
        FILTER (WHERE rp.permission_name IS NOT NULL AND rp.permission_name::TEXT NOT LIKE '%_dept') AS permissions_array
    FROM neiist.membership m
    JOIN neiist.valid_department_roles vdr ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
    LEFT JOIN neiist.role_permissions rp ON vdr.department_name = rp.department_name AND vdr.role_name = rp.role_name
    WHERE m.user_istid = u_istid
      AND (m.to_date IS NULL OR m.to_date >= CURRENT_DATE)
      AND vdr.active = TRUE
    GROUP BY m.user_istid
  ) derived_permissions ON u.istid = derived_permissions.user_istid
  LEFT JOIN (
    SELECT
      sub.user_istid,
      jsonb_object_agg(sub.department_name, sub.perms) AS dept_perms_obj
    FROM (
      SELECT
        m.user_istid,
        m.department_name::TEXT AS department_name,
        jsonb_agg(DISTINCT rp.permission_name::TEXT) FILTER (WHERE rp.permission_name IS NOT NULL) AS perms
      FROM neiist.membership m
      JOIN neiist.valid_department_roles vdr ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
      LEFT JOIN neiist.role_permissions rp ON vdr.department_name = rp.department_name AND vdr.role_name = rp.role_name
      WHERE m.user_istid = u_istid
        AND (m.to_date IS NULL OR m.to_date >= CURRENT_DATE)
        AND vdr.active = TRUE
      GROUP BY m.user_istid, m.department_name
    ) sub
    GROUP BY sub.user_istid
  ) dept_perms ON u.istid = dept_perms.user_istid
  LEFT JOIN (
    SELECT
      m.user_istid,
      CASE
        WHEN bool_or(vdr.access_label = 'admin') THEN 'admin'
        WHEN bool_or(vdr.access_label = 'coordinator') THEN 'coordinator'
      END AS top_label
    FROM neiist.membership m
    JOIN neiist.valid_department_roles vdr ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
    WHERE m.user_istid = u_istid
      AND (m.to_date IS NULL OR m.to_date >= CURRENT_DATE)
      AND vdr.active = TRUE
    GROUP BY m.user_istid
  ) derived_label ON u.istid = derived_label.user_istid
  LEFT JOIN (
    SELECT
      m.user_istid,
      array_agg(DISTINCT m.department_name::TEXT) AS team_array
    FROM neiist.membership m
    WHERE m.user_istid = u_istid
      AND (m.to_date IS NULL OR m.to_date >= CURRENT_DATE)
    GROUP BY m.user_istid
  ) team_list ON u.istid = team_list.user_istid
  WHERE u.istid = u_istid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add user
CREATE OR REPLACE FUNCTION neiist.add_user(
  p_istid VARCHAR(10),
  p_name TEXT,
  p_email TEXT,
  p_alt_email TEXT,
  p_phone TEXT,
  p_courses TEXT[],
  p_github TEXT DEFAULT NULL,
  p_linkedin TEXT DEFAULT NULL
) RETURNS TABLE(
  istid VARCHAR(10),
  name TEXT,
  email TEXT,
  alt_email TEXT,
  neiist_email TEXT,
  outlook_calendar_sync BOOLEAN,
  phone TEXT,
  preferred_contact_method TEXT,
  courses TEXT[],
  permissions TEXT[],
  access_label TEXT,
  teams TEXT[],
  github TEXT,
  linkedin TEXT,
  department_permissions JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO neiist.users (istid, name, email, github, linkedin)
  VALUES (p_istid, p_name, p_email, p_github, p_linkedin);

  -- Insert alternative email if provided
  IF p_alt_email IS NOT NULL THEN
    INSERT INTO neiist.user_contacts (user_istid, contact_type, contact_value)
    VALUES (p_istid, 'alt_email', p_alt_email);
  END IF;

  -- Insert phone if provided
  IF p_phone IS NOT NULL THEN
    INSERT INTO neiist.user_contacts (user_istid, contact_type, contact_value)
    VALUES (p_istid, 'phone', p_phone);
  END IF;

  -- Insert courses if provided
  IF p_courses IS NOT NULL THEN
    INSERT INTO neiist.user_courses (user_istid, course_name)
    SELECT DISTINCT p_istid, unnest(p_courses)
    ON CONFLICT (user_istid, course_name) DO NOTHING;
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_user(p_istid);
END;
$$;

-- Add department
CREATE OR REPLACE FUNCTION neiist.add_department(
  u_name TEXT,
  u_department_type TEXT DEFAULT 'team',
  u_description JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_name) THEN
    RAISE EXCEPTION 'O departamento "%" já existe.', u_name;
  END IF;

  IF u_department_type NOT IN ('team', 'admin_body') THEN
    RAISE EXCEPTION 'Tipo de departamento inválido. Deve ser "team" ou "admin_body".';
  END IF;

  INSERT INTO neiist.departments (name, department_type, active)
  VALUES (u_name, u_department_type, TRUE);

  IF u_department_type = 'team' THEN
    INSERT INTO neiist.teams (name, description)
    VALUES (u_name, COALESCE(u_description, '{}'::jsonb))
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;
  ELSIF u_department_type = 'admin_body' THEN
    INSERT INTO neiist.admin_bodies (name)
    VALUES (u_name)
    ON CONFLICT (name) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove department
CREATE OR REPLACE FUNCTION neiist.remove_department(
  u_name TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_name) THEN
    RAISE EXCEPTION 'O departamento "%" não existe.', u_name;
  END IF;

  UPDATE neiist.departments SET active = FALSE WHERE name = u_name;
  UPDATE neiist.valid_department_roles SET active = FALSE WHERE department_name = u_name;
  UPDATE neiist.membership SET to_date = CURRENT_DATE WHERE department_name = u_name
    AND (to_date IS NULL OR to_date >= CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re/activate department
CREATE OR REPLACE FUNCTION neiist.activate_department(
  u_name TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_name) THEN
    RAISE EXCEPTION 'O departamento "%" não existe.', u_name;
  END IF;

  UPDATE neiist.departments SET active = TRUE WHERE name = u_name;
  UPDATE neiist.valid_department_roles SET active = TRUE WHERE department_name = u_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete department permanently (only if no members exist)
CREATE OR REPLACE FUNCTION neiist.delete_department(
  u_name TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_name) THEN
    RAISE EXCEPTION 'O departamento "%" não existe.', u_name;
  END IF;

  IF EXISTS (SELECT 1 FROM neiist.membership WHERE department_name = u_name) THEN
    RAISE EXCEPTION 'Não é possível eliminar permanentemente um departamento com membros.';
  END IF;

  DELETE FROM neiist.role_permissions WHERE department_name = u_name;
  DELETE FROM neiist.department_role_order WHERE department_name = u_name;
  DELETE FROM neiist.valid_department_roles WHERE department_name = u_name;
  DELETE FROM neiist.teams WHERE name = u_name;
  DELETE FROM neiist.admin_bodies WHERE name = u_name;
  DELETE FROM neiist.departments WHERE name = u_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update team description
CREATE OR REPLACE FUNCTION neiist.update_team_description(
  p_name TEXT,
  p_description JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.teams WHERE name = p_name) THEN
    RAISE EXCEPTION 'A equipa "%" não existe.', p_name;
  END IF;

  UPDATE neiist.teams
  SET description = p_description
  WHERE name = p_name;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION neiist.update_team_description(
  p_name TEXT,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN neiist.update_team_description(
    p_name,
    CASE
      WHEN p_description IS NULL OR p_description = '' THEN '{}'::jsonb
      ELSE jsonb_build_object('pt', p_description)
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add valid department role
CREATE OR REPLACE FUNCTION neiist.add_valid_department_role(
  u_department_name TEXT,
  u_role_name TEXT,
  u_access_label neiist.access_label_enum DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_department_name AND active = TRUE) THEN
    RAISE EXCEPTION 'O departamento "%" não existe ou não está ativo.', u_department_name;
  END IF;

  INSERT INTO neiist.valid_department_roles (department_name, role_name, access_label)
  VALUES (u_department_name, u_role_name, u_access_label)
  ON CONFLICT (department_name, role_name) DO UPDATE SET active = TRUE, access_label = u_access_label;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set role access label
CREATE OR REPLACE FUNCTION neiist.set_role_access_label(
  u_department_name TEXT,
  u_role_name TEXT,
  u_access_label neiist.access_label_enum DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE neiist.valid_department_roles
  SET access_label = u_access_label
  WHERE department_name = u_department_name AND role_name = u_role_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cargo "%" no departamento "%" não encontrado.', u_role_name, u_department_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove valid department role (deactivate)
CREATE OR REPLACE FUNCTION neiist.remove_valid_department_role(
  u_department_name TEXT,
  u_role_name TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.valid_department_roles WHERE department_name = u_department_name
    AND role_name = u_role_name) THEN
    RAISE EXCEPTION 'A posição "%" para o departamento "%" não existe.', u_role_name, u_department_name;
  END IF;

  UPDATE neiist.valid_department_roles SET active = FALSE
    WHERE department_name = u_department_name AND role_name = u_role_name;
  UPDATE neiist.membership SET to_date = CURRENT_DATE
    WHERE department_name = u_department_name AND role_name = u_role_name
      AND (to_date IS NULL OR to_date >= CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete valid department role permanently (only if no members exist)
CREATE OR REPLACE FUNCTION neiist.delete_valid_department_role(
  u_department_name TEXT,
  u_role_name TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM neiist.valid_department_roles
    WHERE department_name = u_department_name AND role_name = u_role_name
  ) THEN
    RAISE EXCEPTION 'A posição "%" para o departamento "%" não existe.', u_role_name, u_department_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM neiist.membership
    WHERE department_name = u_department_name AND role_name = u_role_name
  ) THEN
    RAISE EXCEPTION 'Não é possível eliminar permanentemente um cargo com membros.';
  END IF;

  DELETE FROM neiist.role_permissions WHERE department_name = u_department_name AND role_name = u_role_name;
  DELETE FROM neiist.department_role_order WHERE department_name = u_department_name AND role_name = u_role_name;
  DELETE FROM neiist.valid_department_roles WHERE department_name = u_department_name AND role_name = u_role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add membership with dates
CREATE OR REPLACE FUNCTION neiist.add_membership(
  p_user_istid VARCHAR(10),
  p_department_name TEXT,
  p_role_name TEXT,
  p_from_date DATE DEFAULT CURRENT_DATE,
  p_to_date DATE DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.users WHERE istid = p_user_istid) THEN
    RAISE EXCEPTION 'O utilizador "%" não existe.', p_user_istid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM neiist.valid_department_roles
    WHERE department_name = p_department_name AND role_name = p_role_name AND active = TRUE
  ) THEN
    RAISE EXCEPTION 'O cargo "%" no departamento "%" não existe ou não está ativo.', p_role_name, p_department_name;
  END IF;

  INSERT INTO neiist.membership (user_istid, department_name, role_name, from_date, to_date)
  VALUES (p_user_istid, p_department_name, p_role_name, p_from_date, p_to_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conclude membership
CREATE OR REPLACE FUNCTION neiist.conclude_membership(
  p_user_istid VARCHAR(10),
  p_department_name TEXT,
  p_role_name TEXT,
  p_from_date DATE
) RETURNS VOID AS $$
BEGIN
  UPDATE neiist.membership
  SET to_date = CURRENT_DATE
  WHERE user_istid = p_user_istid
    AND department_name = p_department_name
    AND role_name = p_role_name
    AND from_date = p_from_date
    AND (to_date IS NULL OR to_date >= CURRENT_DATE);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mandato ativo não encontrado para conclusão.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete membership permanently
CREATE OR REPLACE FUNCTION neiist.delete_membership(
  p_user_istid VARCHAR(10),
  p_department_name TEXT,
  p_role_name TEXT,
  p_from_date DATE
) RETURNS VOID AS $$
BEGIN
  DELETE FROM neiist.membership
  WHERE user_istid = p_user_istid
    AND department_name = p_department_name
    AND role_name = p_role_name
    AND from_date = p_from_date;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registo de mandato não encontrado para remoção.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all users
CREATE OR REPLACE FUNCTION neiist.get_all_users()
RETURNS TABLE (
  istid VARCHAR(10),
  name TEXT,
  email TEXT,
  neiist_email TEXT,
  outlook_calendar_sync BOOLEAN,
  phone TEXT,
  courses TEXT[],
  permissions TEXT[],
  access_label TEXT,
  teams TEXT[],
  github TEXT,
  linkedin TEXT,
  department_permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.istid,
    u.name,
    u.email,
    u.neiist_email,
    u.outlook_calendar_sync,
    (SELECT contact_value FROM neiist.user_contacts WHERE user_istid = u.istid AND contact_type = 'phone' LIMIT 1) AS phone,
    ARRAY(SELECT course_name FROM neiist.user_courses WHERE user_istid = u.istid) AS courses,
    COALESCE(derived_permissions.permissions_array, ARRAY[]::TEXT[]) AS permissions,
    derived_label.top_label::TEXT AS access_label,
    COALESCE(user_teams.teams_array, ARRAY[]::TEXT[]) as teams,
    u.github,
    u.linkedin,
    COALESCE(dept_perms.dept_perms_obj, '{}'::JSONB) AS department_permissions
  FROM neiist.users u
  LEFT JOIN (
    SELECT
      m.user_istid,
      array_agg(DISTINCT rp.permission_name::TEXT)
        FILTER (WHERE rp.permission_name IS NOT NULL AND rp.permission_name::TEXT NOT LIKE '%_dept') AS permissions_array
    FROM neiist.membership m
    JOIN neiist.valid_department_roles vdr ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
    LEFT JOIN neiist.role_permissions rp ON vdr.department_name = rp.department_name AND vdr.role_name = rp.role_name
    WHERE (m.to_date IS NULL OR m.to_date >= CURRENT_DATE)
      AND vdr.active = TRUE
    GROUP BY m.user_istid
  ) derived_permissions ON u.istid = derived_permissions.user_istid
  LEFT JOIN (
    SELECT
      sub.user_istid,
      jsonb_object_agg(sub.department_name, sub.perms) AS dept_perms_obj
    FROM (
      SELECT
        m.user_istid,
        m.department_name::TEXT AS department_name,
        jsonb_agg(DISTINCT rp.permission_name::TEXT) FILTER (WHERE rp.permission_name IS NOT NULL) AS perms
      FROM neiist.membership m
      JOIN neiist.valid_department_roles vdr ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
      LEFT JOIN neiist.role_permissions rp ON vdr.department_name = rp.department_name AND vdr.role_name = rp.role_name
      WHERE (m.to_date IS NULL OR m.to_date >= CURRENT_DATE)
        AND vdr.active = TRUE
      GROUP BY m.user_istid, m.department_name
    ) sub
    GROUP BY sub.user_istid
  ) dept_perms ON u.istid = dept_perms.user_istid
  LEFT JOIN (
    SELECT
      m.user_istid,
      CASE
        WHEN bool_or(vdr.access_label = 'admin') THEN 'admin'
        WHEN bool_or(vdr.access_label = 'coordinator') THEN 'coordinator'
      END AS top_label
    FROM neiist.membership m
    JOIN neiist.valid_department_roles vdr ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
    WHERE (m.to_date IS NULL OR m.to_date >= CURRENT_DATE)
      AND vdr.active = TRUE
    GROUP BY m.user_istid
  ) derived_label ON u.istid = derived_label.user_istid
  LEFT JOIN (
    SELECT
      m.user_istid,
      array_agg(DISTINCT m.department_name::TEXT) as teams_array
    FROM neiist.membership m
    WHERE m.to_date IS NULL OR m.to_date >= CURRENT_DATE
    GROUP BY m.user_istid
  ) user_teams ON u.istid = user_teams.user_istid
  ORDER BY
    CASE derived_label.top_label
      WHEN 'admin' THEN 1
      WHEN 'coordinator' THEN 2
      ELSE 3
    END,
    u.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user data
CREATE OR REPLACE FUNCTION neiist.update_user(
  p_istid VARCHAR(10),
  p_updates JSONB
) RETURNS TABLE(
  istid VARCHAR(10),
  name TEXT,
  email TEXT,
  alt_email TEXT,
  neiist_email TEXT,
  outlook_calendar_sync BOOLEAN,
  phone TEXT,
  preferred_contact_method TEXT,
  courses TEXT[],
  permissions TEXT[],
  access_label TEXT,
  teams TEXT[],
  github TEXT,
  linkedin TEXT,
  department_permissions JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Update users table fields
  IF p_updates ? 'name' THEN
    UPDATE neiist.users SET name = p_updates->>'name' WHERE neiist.users.istid = p_istid;
  END IF;
  IF p_updates ? 'email' THEN
    UPDATE neiist.users SET email = p_updates->>'email' WHERE neiist.users.istid = p_istid;
  END IF;
  IF p_updates ? 'neiistEmail' THEN
    UPDATE neiist.users SET neiist_email = NULLIF(p_updates->>'neiistEmail', '') WHERE neiist.users.istid = p_istid;
  END IF;
  IF p_updates ? 'outlookCalendarSync' THEN
    UPDATE neiist.users SET outlook_calendar_sync = COALESCE((p_updates->>'outlookCalendarSync')::BOOLEAN, FALSE) WHERE neiist.users.istid = p_istid;
  END IF;
  IF p_updates ? 'github' THEN
    UPDATE neiist.users SET github = p_updates->>'github' WHERE neiist.users.istid = p_istid;
  END IF;
  IF p_updates ? 'linkedin' THEN
    UPDATE neiist.users SET linkedin = p_updates->>'linkedin' WHERE neiist.users.istid = p_istid;
  END IF;

  -- Update alternativeEmail in user_contacts
  IF p_updates ? 'alternativeEmail' THEN
    IF p_updates->>'alternativeEmail' IS NULL THEN
      DELETE FROM neiist.user_contacts WHERE user_istid = p_istid AND contact_type = 'alt_email';
    ELSE
      INSERT INTO neiist.user_contacts (user_istid, contact_type, contact_value)
      VALUES (p_istid, 'alt_email', p_updates->>'alternativeEmail')
      ON CONFLICT (user_istid, contact_type) DO UPDATE SET contact_value = EXCLUDED.contact_value;
    END IF;
  END IF;

  -- Update phone in user_contacts
  IF p_updates ? 'phone' THEN
    IF p_updates->>'phone' IS NULL THEN
      DELETE FROM neiist.user_contacts WHERE user_istid = p_istid AND contact_type = 'phone';
    ELSE
      INSERT INTO neiist.user_contacts (user_istid, contact_type, contact_value)
      VALUES (p_istid, 'phone', p_updates->>'phone')
      ON CONFLICT (user_istid, contact_type) DO UPDATE SET contact_value = EXCLUDED.contact_value;
    END IF;
  END IF;

  -- Update preferredContactMethod in user_contacts
  IF p_updates ? 'preferredContactMethod' THEN
    UPDATE neiist.user_contacts SET is_preferred = FALSE WHERE user_istid = p_istid;
    UPDATE neiist.user_contacts
    SET is_preferred = TRUE
    WHERE user_istid = p_istid AND contact_type = (p_updates->>'preferredContactMethod')::neiist.contact_method_enum;
  END IF;

  -- Update courses in user_courses
  IF p_updates ? 'courses' THEN
    DELETE FROM neiist.user_courses WHERE user_istid = p_istid;
    IF jsonb_array_length(p_updates->'courses') > 0 THEN
      INSERT INTO neiist.user_courses (user_istid, course_name)
      SELECT DISTINCT p_istid, value::TEXT
      FROM jsonb_array_elements_text(p_updates->'courses') AS value
      ON CONFLICT (user_istid, course_name) DO NOTHING;
    END IF;
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_user(p_istid);
END;
$$;

-- Create a new email verification request
CREATE OR REPLACE FUNCTION neiist.add_email_verification(
  p_istid VARCHAR(10),
  p_email TEXT,
  p_token TEXT,
  p_expires_at TIMESTAMPTZ
) RETURNS VOID AS $$
BEGIN
  INSERT INTO neiist.email_token (istid, email, token, expires_at)
  VALUES (p_istid, p_email, p_token, p_expires_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get verification request by token
CREATE OR REPLACE FUNCTION neiist.get_email_verification(
  p_token TEXT
) RETURNS TABLE(istid VARCHAR(10), email TEXT, expires_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY SELECT email_token.istid, email_token.email, email_token.expires_at
  FROM neiist.email_token
  WHERE email_token.token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove a verification request
CREATE OR REPLACE FUNCTION neiist.delete_email_verification(
  p_token TEXT
) RETURNS VOID AS $$
BEGIN
  DELETE FROM neiist.email_token WHERE token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get verification request by user
CREATE OR REPLACE FUNCTION neiist.get_email_verification_by_user(
  p_istid VARCHAR(10)
) RETURNS TABLE(email TEXT, expires_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT email_token.email, email_token.expires_at
  FROM neiist.email_token
  WHERE email_token.istid = p_istid
    AND email_token.expires_at > NOW()
  ORDER BY email_token.expires_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all departments
CREATE OR REPLACE FUNCTION neiist.get_all_departments()
RETURNS TABLE (
  name TEXT,
  active BOOLEAN,
  department_type TEXT,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT d.name::TEXT, d.active, d.department_type::TEXT, d.display_order
  FROM neiist.departments d
  ORDER BY d.display_order, d.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all teams
CREATE OR REPLACE FUNCTION neiist.get_all_teams()
RETURNS TABLE (
  name TEXT,
  description JSONB,
  active BOOLEAN,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.name::TEXT, t.description, d.active, d.display_order
  FROM neiist.teams t
  JOIN neiist.departments d ON t.name = d.name
  ORDER BY d.display_order, t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all admin bodies
CREATE OR REPLACE FUNCTION neiist.get_all_admin_bodies()
RETURNS TABLE (
  name TEXT,
  active BOOLEAN,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT ab.name::TEXT, d.active, d.display_order
  FROM neiist.admin_bodies ab
  JOIN neiist.departments d ON ab.name = d.name
  ORDER BY d.display_order, ab.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all department roles
CREATE OR REPLACE FUNCTION neiist.get_all_department_roles()
RETURNS TABLE (
  department_name TEXT,
  department_type TEXT,
  role_name TEXT,
  active BOOLEAN,
  access_label TEXT,
  permissions TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vdr.department_name::TEXT,
    d.department_type::TEXT,
    vdr.role_name::TEXT,
    vdr.active,
    vdr.access_label::TEXT,
    COALESCE(
      array_agg(rp.permission_name::TEXT ORDER BY rp.permission_name)
        FILTER (WHERE rp.permission_name IS NOT NULL),
      ARRAY[]::TEXT[]
    ) AS permissions
  FROM neiist.valid_department_roles vdr
  JOIN neiist.departments d ON vdr.department_name = d.name
  LEFT JOIN neiist.role_permissions rp
    ON vdr.department_name = rp.department_name AND vdr.role_name = rp.role_name
  GROUP BY vdr.department_name, d.department_type, vdr.role_name, vdr.active, vdr.access_label
  ORDER BY d.department_type, vdr.department_name, vdr.role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all memberships
CREATE OR REPLACE FUNCTION neiist.get_all_memberships()
RETURNS TABLE (
  user_istid VARCHAR(10),
  user_name TEXT,
  department_name TEXT,
  department_type TEXT,
  role_name TEXT,
  from_date DATE,
  to_date DATE,
  active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.user_istid,
    u.name AS user_name,
    m.department_name::TEXT,
    d.department_type::TEXT,
    m.role_name::TEXT,
    m.from_date,
    m.to_date,
    CASE
      WHEN m.to_date IS NULL OR m.to_date >= CURRENT_DATE THEN TRUE
      ELSE FALSE
    END AS active
  FROM neiist.membership m
  JOIN neiist.users u ON m.user_istid = u.istid
  JOIN neiist.departments d ON m.department_name = d.name
  ORDER BY d.display_order, u.name, m.role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set role permissions
CREATE OR REPLACE FUNCTION neiist.set_role_permissions(
  p_department_name TEXT,
  p_role_name TEXT,
  p_permissions TEXT[]
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM neiist.valid_department_roles
    WHERE department_name = p_department_name AND role_name = p_role_name AND active = TRUE
  ) THEN
    RAISE EXCEPTION 'O cargo "%" no departamento "%" não existe ou não está ativo.', p_role_name, p_department_name;
  END IF;

  DELETE FROM neiist.role_permissions
  WHERE department_name = p_department_name
    AND role_name = p_role_name;

  IF p_permissions IS NOT NULL AND array_length(p_permissions, 1) > 0 THEN
    INSERT INTO neiist.role_permissions (department_name, role_name, permission_name)
    SELECT p_department_name, p_role_name, unnest(p_permissions)::neiist.permission_enum
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get academic years
CREATE OR REPLACE FUNCTION neiist.get_academic_years()
RETURNS TABLE (
  academic_year TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH bounds AS (
    SELECT
      COALESCE(MIN(
        CASE
          WHEN (EXTRACT(MONTH FROM from_date) = 8 AND EXTRACT(DAY FROM from_date) >= 15)
               OR EXTRACT(MONTH FROM from_date) >= 9
            THEN EXTRACT(YEAR FROM from_date)::INT
          ELSE EXTRACT(YEAR FROM from_date)::INT - 1
        END
      ), EXTRACT(YEAR FROM CURRENT_DATE)::INT) AS min_year,
      COALESCE(MAX(
        CASE
          WHEN to_date IS NOT NULL THEN
            CASE
              WHEN (EXTRACT(MONTH FROM to_date) = 8 AND EXTRACT(DAY FROM to_date) >= 15)
                   OR EXTRACT(MONTH FROM to_date) >= 9
                THEN EXTRACT(YEAR FROM to_date)::INT
              ELSE EXTRACT(YEAR FROM to_date)::INT - 1
            END
          ELSE
            CASE
              WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 8 THEN EXTRACT(YEAR FROM CURRENT_DATE)::INT
              ELSE EXTRACT(YEAR FROM CURRENT_DATE)::INT - 1
            END
        END
      ), EXTRACT(YEAR FROM CURRENT_DATE)::INT) AS max_year
    FROM neiist.membership
  ),
  series AS (
    SELECT generate_series(min_year, max_year) AS y FROM bounds
  )
  SELECT (y::TEXT || '/' || (y + 1)::TEXT) AS academic_year
  FROM series
  ORDER BY y DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get memberships for specific academic year
CREATE OR REPLACE FUNCTION neiist.get_memberships_for_academic_year(p_academic_year TEXT)
RETURNS TABLE (
  user_istid VARCHAR(10),
  user_name TEXT,
  user_email TEXT,
  user_github TEXT,
  user_linkedin TEXT,
  department_name TEXT,
  department_type TEXT,
  role_name TEXT,
  from_date DATE,
  to_date DATE,
  active BOOLEAN
) AS $$
DECLARE
  v_start_year INT;
  v_end_year INT;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  IF p_academic_year !~ '^\d{4}/\d{4}$' THEN
    RAISE EXCEPTION 'Formato de ano letivo inválido. Esperado YYYY/YYYY (ex: 2024/2025).';
  END IF;

  v_start_year := SPLIT_PART(p_academic_year, '/', 1)::INT;
  v_end_year := SPLIT_PART(p_academic_year, '/', 2)::INT;
  v_start_date := TO_DATE(v_start_year::TEXT || '-09-01', 'YYYY-MM-DD');
  v_end_date := TO_DATE(v_end_year::TEXT || '-07-31', 'YYYY-MM-DD');

  RETURN QUERY
  SELECT
    m.user_istid,
    u.name AS user_name,
    u.email::TEXT AS user_email,
    u.github::TEXT AS user_github,
    u.linkedin::TEXT AS user_linkedin,
    m.department_name::TEXT,
    d.department_type::TEXT,
    m.role_name::TEXT,
    m.from_date,
    m.to_date,
    CASE
      WHEN m.to_date IS NULL OR m.to_date >= CURRENT_DATE THEN TRUE
      ELSE FALSE
    END AS active
  FROM neiist.membership m
  JOIN neiist.users u ON m.user_istid = u.istid
  JOIN neiist.departments d ON m.department_name = d.name
  WHERE m.from_date <= v_end_date
    AND (m.to_date IS NULL OR m.to_date > v_start_date)
  ORDER BY d.display_order, u.name, m.role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get hierarchy for a department
CREATE OR REPLACE FUNCTION neiist.get_department_role_order(
  p_department TEXT
) RETURNS TABLE(role_name TEXT, "position" INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT dro.role_name::TEXT, dro.position
  FROM neiist.department_role_order dro
  WHERE dro.department_name = p_department
  ORDER BY dro.position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set hierarchy for a department
CREATE OR REPLACE FUNCTION neiist.set_department_role_order(
  p_department TEXT,
  p_roles TEXT[]
) RETURNS VOID AS $$
BEGIN
  DELETE FROM neiist.department_role_order
  WHERE department_name = p_department;

  INSERT INTO neiist.department_role_order (department_name, role_name, position)
  SELECT p_department, role, idx
  FROM unnest(p_roles) WITH ORDINALITY AS t(role, idx);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GET USER MEMBERSHIPS
CREATE OR REPLACE FUNCTION neiist.get_user_memberships(
  p_istid VARCHAR(10),
  p_active_only BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  user_istid VARCHAR(10),
  user_name TEXT,
  department_name TEXT,
  department_type TEXT,
  role_name TEXT,
  from_date DATE,
  to_date DATE,
  active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.user_istid,
    u.name AS user_name,
    m.department_name::TEXT,
    d.department_type::TEXT,
    m.role_name::TEXT,
    m.from_date,
    m.to_date,
    (m.to_date IS NULL OR m.to_date >= CURRENT_DATE) AS active
  FROM neiist.membership m
  JOIN neiist.users u ON m.user_istid = u.istid
  LEFT JOIN neiist.departments d ON m.department_name = d.name
  WHERE m.user_istid = p_istid
    AND (NOT p_active_only OR (m.to_date IS NULL OR m.to_date >= CURRENT_DATE))
  ORDER BY m.from_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GET BATCH DEPARTMENT ROLE ORDERS
CREATE OR REPLACE FUNCTION neiist.get_department_role_orders(p_departments TEXT[])
RETURNS TABLE (
  department_name TEXT,
  role_name TEXT,
  "position" INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT dro.department_name::TEXT, dro.role_name::TEXT, dro.position
  FROM neiist.department_role_order dro
  WHERE dro.department_name = ANY(p_departments)
  ORDER BY dro.department_name, dro.position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DELETE USER
CREATE OR REPLACE FUNCTION neiist.delete_user(p_istid VARCHAR(10))
RETURNS TABLE(success BOOLEAN, was_member BOOLEAN) AS $$
DECLARE
  v_is_member BOOLEAN;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.users WHERE istid = p_istid) THEN
    RETURN QUERY SELECT FALSE, FALSE;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM neiist.membership WHERE user_istid = p_istid
  ) INTO v_is_member;

  DELETE FROM neiist.user_contacts WHERE user_istid = p_istid;
  DELETE FROM neiist.user_courses WHERE user_istid = p_istid;
  DELETE FROM neiist.email_token WHERE istid = p_istid;
  DELETE FROM neiist.activities_sign_up WHERE user_istid = p_istid;
  DELETE FROM neiist.game_score WHERE user_istid = p_istid;

  UPDATE neiist.orders o
  SET user_istid = NULL,
    customer_name = u.name,
    customer_email = u.email,
    customer_phone = NULL
  FROM neiist.users u
  WHERE o.user_istid = p_istid AND u.istid = p_istid;

  IF v_is_member THEN
    UPDATE neiist.users
    SET email = 'deleted-' || gen_random_uuid() || '@deleted.neiist.pt',
      github = NULL,
      linkedin = NULL
    WHERE istid = p_istid;
  ELSE
    DELETE FROM neiist.users WHERE istid = p_istid;
  END IF;

  RETURN QUERY SELECT TRUE, v_is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get department display order
CREATE OR REPLACE FUNCTION neiist.get_department_display_order()
RETURNS TABLE (
  name TEXT,
  department_type TEXT,
  active BOOLEAN,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT d.name::TEXT, d.department_type::TEXT, d.active, d.display_order
  FROM neiist.departments d
  ORDER BY d.display_order, d.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set department display order
CREATE OR REPLACE FUNCTION neiist.set_department_display_order(p_departments TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  dept_name TEXT;
  idx INT := 1;
BEGIN
  FOREACH dept_name IN ARRAY p_departments
  LOOP
    UPDATE neiist.departments SET display_order = idx WHERE name = dept_name;
    idx := idx + 1;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
