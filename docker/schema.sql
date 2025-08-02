-- SCHEMA
CREATE SCHEMA IF NOT EXISTS neiist;

-- ROLES
CREATE ROLE neiist_app_user WITH LOGIN PASSWORD 'neiist_app_user_password';

-- PERMISSIONS
GRANT USAGE ON SCHEMA neiist TO neiist_app_user;
REVOKE ALL ON ALL TABLES IN SCHEMA neiist FROM neiist_app_user;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA neiist FROM neiist_app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA neiist TO neiist_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA neiist GRANT EXECUTE ON FUNCTIONS TO neiist_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA neiist REVOKE ALL ON TABLES FROM neiist_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA neiist REVOKE ALL ON SEQUENCES FROM neiist_app_user;

-- ENUM TYPES
CREATE TYPE neiist.user_access_enum AS ENUM (
    'admin',
    'coordinator',
    'member'
);

CREATE TYPE neiist.contact_method_enum AS ENUM (
    'email',
    'phone',
    'alternative_email'
);

-- USERS TABLE
CREATE TABLE neiist.users (
    istid VARCHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    alternative_email TEXT UNIQUE,
    phone VARCHAR(15),
    preferred_contact_method neiist.contact_method_enum,
    photo_path TEXT,
    courses TEXT[]
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
    name VARCHAR(30) PRIMARY KEY,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- TEAMS TABLE
CREATE TABLE neiist.teams (
   name VARCHAR(30) PRIMARY KEY REFERENCES neiist.departments(name),
   description TEXT
);

-- ADMINISTRATION BODIES TABLE
CREATE TABLE neiist.admin_bodies (
    name VARCHAR(30) PRIMARY KEY REFERENCES neiist.departments(name)
);

-- VALID (DEPARTMENT | ROLE) COMBINATIONS TABLE
CREATE TABLE neiist.valid_department_roles (
    department_name VARCHAR(30) REFERENCES neiist.departments(name),
    role_name VARCHAR(40) NOT NULL,
    PRIMARY KEY (department_name, role_name),
    access neiist.user_access_enum NOT NULL DEFAULT 'member',
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- MEMBERSHIP TABLE
CREATE TABLE neiist.membership (
    user_istid VARCHAR(10) REFERENCES neiist.users(istid),
    department_name VARCHAR(30) NOT NULL,
    role_name VARCHAR(40) NOT NULL,
    from_date DATE NOT NULL DEFAULT CURRENT_DATE,
    to_date DATE DEFAULT NULL,
    FOREIGN KEY (department_name, role_name)
        REFERENCES neiist.valid_department_roles(department_name, role_name),
    CONSTRAINT valid_member_dates CHECK (to_date IS NULL OR to_date > from_date),
    PRIMARY KEY (user_istid, department_name, role_name)
);

-- USER ACCESS ROLES TABLE
CREATE TABLE neiist.user_access_roles (
    user_istid VARCHAR(10) REFERENCES neiist.users(istid),
    access neiist.user_access_enum,
    PRIMARY KEY (user_istid, access)
);

-- BLOG/POSTS TABLE
CREATE TABLE neiist.posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    author TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE neiist.posts TO neiist_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA neiist GRANT INSERT, SELECT, UPDATE, DELETE ON TABLES TO neiist_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA neiist TO neiist_app_user;
-- TODO : Retirar 

-- TAGS TABLE

CREATE TABLE neiist.tags (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL
);

GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE neiist.tags TO neiist_app_user;

-- TAGS MAPPING (seed)
INSERT INTO neiist.tags (name, category) VALUES
  ('Workshops', 'Eventos'),
  ('Recrutamento', 'Eventos'),
  ('Entrevistas', 'Eventos'),
  ('Critical Software', 'Empresas'),
  ('OutSystems', 'Empresas'),
  ('Feedzai', 'Empresas'),
  ('Farfetch', 'Empresas'),
  ('Talkdesk', 'Empresas'),
  ('Unbabel', 'Empresas'),
  ('Defined.ai', 'Empresas'),
  ('Sword Health', 'Empresas'),
  ('Codacy', 'Empresas'),
  ('Jumia', 'Empresas');

-- FUNCTIONS

-- Get user
CREATE OR REPLACE FUNCTION neiist.get_user(
    u_istid VARCHAR(10)
) RETURNS TABLE (
    istid VARCHAR(10),
    name TEXT,
    email TEXT,
    alternative_email TEXT,
    phone VARCHAR(15),
    preferred_contact_method TEXT,  -- Changed from neiist.contact_method_enum to TEXT
    photo_path TEXT,
    courses TEXT[],
    roles TEXT[],
    teams VARCHAR(30)[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.istid,
        u.name,
        u.email,
        u.alternative_email,
        u.phone,
        u.preferred_contact_method::TEXT,
        u.photo_path,
        u.courses,
        COALESCE(access_levels.access_array, ARRAY[]::TEXT[]) AS roles,
        COALESCE(team_list.team_array, ARRAY[]::VARCHAR(30)[]) AS teams
    FROM neiist.users u
    LEFT JOIN (
        SELECT 
            uar.user_istid,
            array_agg(DISTINCT uar.access::TEXT) AS access_array
        FROM neiist.user_access_roles uar
        WHERE uar.user_istid = u_istid
        GROUP BY uar.user_istid
    ) access_levels ON u.istid = access_levels.user_istid
    LEFT JOIN (
        SELECT 
            m.user_istid,
            array_agg(DISTINCT m.department_name) AS team_array
        FROM neiist.membership m
        WHERE m.user_istid = u_istid
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
    p_alternative_email TEXT,
    p_phone VARCHAR(15),
    p_photo_path TEXT,
    p_courses TEXT[]
) RETURNS TABLE(
    istid VARCHAR(10),
    name TEXT,
    email TEXT,
    alternative_email TEXT,
    phone VARCHAR(15),
    preferred_contact_method TEXT,
    photo_path TEXT,
    courses TEXT[],
    roles TEXT[],
    teams VARCHAR(30)[]
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO neiist.users (istid, name, email, alternative_email, phone, photo_path, courses)
    VALUES (p_istid, p_name, p_email, p_alternative_email, p_phone, p_photo_path, p_courses);
    
    RETURN QUERY SELECT * FROM neiist.get_user(p_istid);
END;
$$;

-- Add department
CREATE OR REPLACE FUNCTION neiist.add_department(
    u_name VARCHAR(30)
) RETURNS VOID AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_name) THEN
        RAISE EXCEPTION 'O departamento "%" já existe.', u_name;
    END IF;
    INSERT INTO neiist.departments (name) VALUES (u_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove department
CREATE OR REPLACE FUNCTION neiist.remove_department(
    u_name VARCHAR(30)
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_name)
    THEN
        RAISE EXCEPTION 'O departamento "%" não existe.', u_name;
    END IF;
    UPDATE neiist.departments SET active = FALSE WHERE name = u_name;
    UPDATE neiist.valid_department_roles SET active = FALSE WHERE department_name = u_name;
    UPDATE neiist.membership SET active = FALSE WHERE department_name = u_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add team
CREATE OR REPLACE FUNCTION neiist.add_team(
    u_name VARCHAR(30),
    u_description TEXT
) RETURNS VOID AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM neiist.teams WHERE name = u_name) THEN
        RAISE EXCEPTION 'A equipa "%" já existe.', u_name;
    END IF;
    INSERT INTO neiist.teams (name, description) VALUES (u_name, u_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove team
CREATE OR REPLACE FUNCTION neiist.remove_team(
    u_name VARCHAR(30)
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM neiist.teams WHERE name = u_name)
    THEN
        RAISE EXCEPTION 'A equipa "%" não existe.', u_name;
    END IF;
    UPDATE neiist.teams SET active = FALSE WHERE name = u_name;
    UPDATE neiist.valid_department_roles SET active = FALSE WHERE department_name = u_name;
    UPDATE neiist.membership SET active = FALSE WHERE department_name = u_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add administration body
CREATE OR REPLACE FUNCTION neiist.add_admin_body(
    u_name VARCHAR(30)
) RETURNS VOID AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM neiist.admin_bodies WHERE name = u_name)
    THEN
        RAISE EXCEPTION 'O órgão de administração "%" já existe.', u_name;
    END IF;
    INSERT INTO neiist.admin_bodies (name) VALUES (u_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove administration body
CREATE OR REPLACE FUNCTION neiist.remove_admin_body(
    u_name VARCHAR(30)
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM neiist.admin_bodies WHERE name = u_name
    ) THEN
        RAISE EXCEPTION 'O órgão de administração "%" não existe.', u_name;
    END IF;
    UPDATE neiist.admin_bodies SET active = FALSE WHERE name = u_name;
    UPDATE neiist.valid_department_roles SET active = FALSE WHERE department_name = u_name;
    UPDATE neiist.membership SET active = FALSE WHERE department_name = u_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add valid department role
CREATE OR REPLACE FUNCTION neiist.add_valid_department_role(
    u_department_name VARCHAR(30),
    u_role_name VARCHAR(40),
    u_access neiist.user_access_enum DEFAULT 'member'
) RETURNS VOID AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM neiist.valid_department_roles
               WHERE department_name = u_department_name
                 AND role_name = u_role_name
                 AND access = u_access) THEN
        RAISE EXCEPTION 'A posição "%" para o departamento "%" já existe.', u_role_name, u_department_name;
    END IF;
    INSERT INTO neiist.valid_department_roles (department_name, role_name, access)
    VALUES (u_department_name, u_role_name, u_access);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove valid department role
CREATE OR REPLACE FUNCTION neiist.remove_valid_department_role(
    u_department_name VARCHAR(30),
    u_role_name VARCHAR(40)
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM neiist.valid_department_roles
                   WHERE department_name = u_department_name
                     AND role_name = u_role_name) THEN
        RAISE EXCEPTION 'A posição "%" para o departamento "%" não existe.', u_role_name, u_department_name;
    END IF;
    UPDATE neiist.valid_department_roles SET active = FALSE
    WHERE department_name = u_department_name AND role_name = u_role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add team member
CREATE OR REPLACE FUNCTION neiist.add_team_member(
    u_user_istid VARCHAR(10),
    u_department_name VARCHAR(30),
    u_role_name VARCHAR(40)
) RETURNS VOID AS $$
DECLARE
    v_role_access neiist.user_access_enum;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM neiist.users WHERE istid = u_user_istid) THEN
        RAISE EXCEPTION 'O utilizador "%" não existe.', u_user_istid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM neiist.valid_department_roles
        WHERE department_name = u_department_name
        AND role_name = u_role_name) THEN
        RAISE EXCEPTION 'A posição "%" para o departamento "%" não existe.', u_role_name, u_department_name;
    END IF;
    INSERT INTO neiist.membership (user_istid, department_name, role_name)
    VALUES (u_user_istid, u_department_name, u_role_name);
    SELECT access INTO v_role_access FROM neiist.valid_department_roles
    WHERE department_name = u_department_name AND role_name = u_role_name;
    INSERT INTO neiist.user_access_roles (user_istid, access) VALUES (u_user_istid, v_role_access)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove team member
CREATE OR REPLACE FUNCTION neiist.remove_team_member(
    u_user_istid VARCHAR(10),
    u_department_name VARCHAR(30),
    u_role_name VARCHAR(40)
) RETURNS VOID AS $$
DECLARE 
    current_access neiist.user_access_enum;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM neiist.membership
        WHERE user_istid = u_user_istid    
        AND department_name = u_department_name
        AND role_name = u_role_name
        AND (to_date IS NULL OR to_date > CURRENT_DATE)) THEN
        RAISE EXCEPTION 'O membro da equipe "%" não existe.', u_user_istid;
    END IF;
    
    UPDATE neiist.membership SET to_date = CURRENT_DATE 
    WHERE user_istid = u_user_istid
      AND department_name = u_department_name
      AND role_name = u_role_name
      AND (to_date IS NULL OR to_date > CURRENT_DATE);

    SELECT access INTO current_access FROM neiist.valid_department_roles
        WHERE department_name = u_department_name
        AND role_name = u_role_name;
    IF NOT EXISTS (
        SELECT 1 FROM neiist.membership m
        JOIN neiist.valid_department_roles vdr
            ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
        WHERE m.user_istid = u_user_istid
          AND vdr.access = current_access
          AND (m.to_date IS NULL OR m.to_date > CURRENT_DATE)
          AND NOT (m.department_name = u_department_name AND m.role_name = u_role_name)
    ) THEN
        DELETE FROM neiist.user_access_roles 
        WHERE user_istid = u_user_istid AND access = current_access;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get available roles for a department
CREATE OR REPLACE FUNCTION neiist.get_department_roles(u_department_name VARCHAR(30))
RETURNS TABLE (
    role_name VARCHAR(40),
    access neiist.user_access_enum,
    active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT vdr.role_name, vdr.access, vdr.active
    FROM neiist.valid_department_roles vdr
    WHERE vdr.department_name = u_department_name
    ORDER BY vdr.access DESC, vdr.role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get users with a specific access level
CREATE OR REPLACE FUNCTION neiist.get_users_by_access(u_access neiist.user_access_enum)
RETURNS TABLE (
    istid VARCHAR(10),
    name TEXT,
    email TEXT,
    phone VARCHAR(15),
    courses TEXT[],
    photo_path TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT u.istid, u.name, u.email, u.phone, u.courses, u.photo_path
    FROM neiist.users u
    JOIN neiist.user_access_roles uar ON u.istid = uar.user_istid
    WHERE uar.access = u_access
    ORDER BY u.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gett all users
CREATE OR REPLACE FUNCTION neiist.get_all_users()
RETURNS TABLE (
    istid VARCHAR(10),
    name TEXT,
    email TEXT,
    phone VARCHAR(15),
    courses TEXT[],
    photo_path TEXT,
    roles TEXT[],
    teams VARCHAR(30)[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.istid,
        u.name,
        u.email,
        u.phone,
        u.courses,
        u.photo_path,
        COALESCE(access_levels.access_array, ARRAY[]::TEXT[]) AS roles,
        COALESCE(user_teams.teams_array,ARRAY[]::VARCHAR(30)[]) as teams
    FROM neiist.users u
    LEFT JOIN (
        SELECT 
            uar.user_istid,
            array_agg(uar.access::TEXT) as access_array  -- ADD ::TEXT HERE!
        FROM neiist.user_access_roles uar
        GROUP BY uar.user_istid
    ) access_levels ON u.istid = access_levels.user_istid
    LEFT JOIN (
        SELECT 
            m.user_istid,
            array_agg(DISTINCT m.department_name) as teams_array
        FROM neiist.membership m
        WHERE m.to_date IS NULL OR m.to_date > CURRENT_DATE
        GROUP BY m.user_istid
    ) user_teams ON u.istid = user_teams.user_istid
    ORDER BY 
        CASE 
            WHEN 'admin' = ANY(COALESCE(access_levels.access_array, ARRAY[]::TEXT[])) THEN 1
            WHEN 'coordinator' = ANY(COALESCE(access_levels.access_array, ARRAY[]::TEXT[])) THEN 2
            WHEN 'member' = ANY(COALESCE(access_levels.access_array, ARRAY[]::TEXT[])) THEN 3
            ELSE 4
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
    alternative_email TEXT,
    phone VARCHAR(15),
    preferred_contact_method TEXT,  -- Changed from enum to TEXT
    photo_path TEXT,
    courses TEXT[],
    roles TEXT[],
    teams VARCHAR(30)[]
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    update_query TEXT := 'UPDATE neiist.users SET ';
    where_clause TEXT := ' WHERE istid = $1';
    set_clauses TEXT[] := ARRAY[]::TEXT[];
    param_count INTEGER := 1;
    param_values TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Build the SET clauses and collect parameter values
    IF p_updates ? 'name' THEN
        param_count := param_count + 1;
        set_clauses := array_append(set_clauses, 'name = $' || param_count);
        param_values := array_append(param_values, p_updates->>'name');
    END IF;

    IF p_updates ? 'email' THEN
        param_count := param_count + 1;
        set_clauses := array_append(set_clauses, 'email = $' || param_count);
        param_values := array_append(param_values, p_updates->>'email');
    END IF;

    IF p_updates ? 'alternativeEmail' THEN
        param_count := param_count + 1;
        set_clauses := array_append(set_clauses, 'alternative_email = $' || param_count);
        param_values := array_append(param_values, p_updates->>'alternativeEmail');
    END IF;

    IF p_updates ? 'phone' THEN
        param_count := param_count + 1;
        set_clauses := array_append(set_clauses, 'phone = $' || param_count);
        param_values := array_append(param_values, p_updates->>'phone');
    END IF;

    IF p_updates ? 'preferredContactMethod' THEN
        param_count := param_count + 1;
        set_clauses := array_append(set_clauses, 'preferred_contact_method = $' || param_count || '::neiist.contact_method_enum');
        param_values := array_append(param_values, p_updates->>'preferredContactMethod');
    END IF;

    IF p_updates ? 'courses' THEN
        param_count := param_count + 1;
        set_clauses := array_append(set_clauses, 'courses = $' || param_count || '::TEXT[]');
        param_values := array_append(param_values, array_to_string(ARRAY(SELECT jsonb_array_elements_text(p_updates->'courses')), ','));
    END IF;

    -- If no updates, just return current user
    IF array_length(set_clauses, 1) IS NULL THEN
        RETURN QUERY SELECT * FROM neiist.get_user(p_istid);
        RETURN;
    END IF;

    -- Build final query
    update_query := update_query || array_to_string(set_clauses, ', ') || where_clause;

    -- Execute with the exact number of parameters needed
    CASE array_length(param_values, 1)
        WHEN 1 THEN
            EXECUTE update_query USING p_istid, param_values[1];
        WHEN 2 THEN
            EXECUTE update_query USING p_istid, param_values[1], param_values[2];
        WHEN 3 THEN
            EXECUTE update_query USING p_istid, param_values[1], param_values[2], param_values[3];
        WHEN 4 THEN
            EXECUTE update_query USING p_istid, param_values[1], param_values[2], param_values[3], param_values[4];
        WHEN 5 THEN
            EXECUTE update_query USING p_istid, param_values[1], param_values[2], param_values[3], param_values[4], param_values[5];
        WHEN 6 THEN
            EXECUTE update_query USING p_istid, param_values[1], param_values[2], param_values[3], param_values[4], param_values[5], param_values[6];
        ELSE
            RAISE EXCEPTION 'Too many parameters: %', array_length(param_values, 1);
    END CASE;

    RETURN QUERY SELECT * FROM neiist.get_user(p_istid);
END;
$$;

-- Update user photo path
CREATE OR REPLACE FUNCTION neiist.update_user_photo(
    p_istid VARCHAR(10),
    p_photo_data TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE neiist.users 
    SET photo_path = p_photo_data
    WHERE istid = p_istid;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with istid % not found', p_istid;
    END IF;
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
    name VARCHAR(30),
    active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT d.name, d.active
    FROM neiist.departments d
    ORDER BY d.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all teams
CREATE OR REPLACE FUNCTION neiist.get_all_teams()
RETURNS TABLE (
    name VARCHAR(30),
    description TEXT,
    active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.name, t.description, d.active
    FROM neiist.teams t
    JOIN neiist.departments d ON t.name = d.name
    WHERE d.active = TRUE
    ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all admin bodies
CREATE OR REPLACE FUNCTION neiist.get_all_admin_bodies()
RETURNS TABLE (
    name VARCHAR(30),
    active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT ab.name, d.active
    FROM neiist.admin_bodies ab
    JOIN neiist.departments d ON ab.name = d.name
    WHERE d.active = TRUE
    ORDER BY ab.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all valid department roles (useful for admin interface)
CREATE OR REPLACE FUNCTION neiist.get_all_valid_department_roles()
RETURNS TABLE (
    department_name VARCHAR(30),
    role_name VARCHAR(40),
    access neiist.user_access_enum,
    active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT vdr.department_name, vdr.role_name, vdr.access, vdr.active
    FROM neiist.valid_department_roles vdr
    ORDER BY vdr.department_name, vdr.access DESC, vdr.role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all memberships (useful for admin interface)
CREATE OR REPLACE FUNCTION neiist.get_all_memberships()
RETURNS TABLE (
    user_istid VARCHAR(10),
    user_name TEXT,
    department_name VARCHAR(30),
    role_name VARCHAR(40),
    from_date DATE,
    to_date DATE,
    active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.user_istid,
        u.name as user_name,
        m.department_name,
        m.role_name,
        m.from_date,
        m.to_date,
        CASE 
            WHEN m.to_date IS NULL OR m.to_date > CURRENT_DATE THEN TRUE
            ELSE FALSE
        END as active
    FROM neiist.membership m
    JOIN neiist.users u ON m.user_istid = u.istid
    ORDER BY u.name, m.department_name, m.role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
