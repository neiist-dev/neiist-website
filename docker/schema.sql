-- TODO: Add shop and blog tables. Add getter functions.

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

-- USERS TABLE
CREATE TABLE neiist.users (
    istid VARCHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone VARCHAR(15),
    photo_path TEXT,
    courses TEXT[]
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

-- FUNCTIONS

-- Get user
CREATE OR REPLACE FUNCTION neiist.get_user(
    u_istid VARCHAR(10)
) RETURNS TABLE (
    istid VARCHAR(10),
    name TEXT,
    email TEXT,
    phone VARCHAR(15),
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
        u.phone,
        u.photo_path,
        u.courses,
        COALESCE(access_levels.access_array, ARRAY[]::TEXT[]) as roles,
        COALESCE(user_teams.teams_array, ARRAY[]::VARCHAR(30)[]) as teams
    FROM neiist.users u
    LEFT JOIN (
        SELECT uar.user_istid, array_agg(uar.access::TEXT) as access_array
        FROM neiist.user_access_roles uar WHERE uar.user_istid = u_istid
        GROUP BY uar.user_istid
    ) access_levels ON u.istid = access_levels.user_istid
    LEFT JOIN (
        SELECT 
            m.user_istid,
            array_agg(DISTINCT m.department_name) as teams_array
        FROM neiist.membership m
        WHERE m.user_istid = u_istid 
          AND (m.to_date IS NULL OR m.to_date > CURRENT_DATE)
        GROUP BY m.user_istid
    ) user_teams ON u.istid = user_teams.user_istid
    WHERE u.istid = u_istid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add user
CREATE OR REPLACE FUNCTION neiist.add_user(
    u_istid VARCHAR(10),
    u_name TEXT,
    u_email TEXT,
    u_phone VARCHAR(15),
    u_photo_path TEXT,
    u_courses TEXT[]
) RETURNS TABLE (
    istid VARCHAR(10),
    name TEXT,
    email TEXT,
    phone VARCHAR(15),
    photo_path TEXT,
    courses TEXT[],
    roles TEXT[],
    teams VARCHAR(30)[]
) AS $$
BEGIN
    INSERT INTO neiist.users (istid, name, email, phone, photo_path, courses)
    VALUES (u_istid, u_name, u_email, u_phone, u_photo_path, u_courses);
    RETURN QUERY SELECT * FROM neiist.get_user(u_istid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
) RETURNS TEXT AS $$
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
DECLARE current_access neiist.user_access_enum;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM neiist.membership
        WHERE user_istid = u_user_istid    
        AND department_name = u_department_name
        AND role_name = u_role_name) THEN
        RAISE EXCEPTION 'O membro da equipe "%" não existe.', u_user_istid;
    END IF;
    UPDATE neiist.membership SET active = FALSE, to_date = CURRENT_DATE WHERE user_istid = u_user_istid
      AND department_name = u_department_name
      AND role_name = u_role_name;

    SELECT access INTO current_access FROM neiist.valid_department_roles
        WHERE department_name = u_department_name
        AND role_name = u_role_name;

    IF NOT EXISTS (
        SELECT 1 FROM neiist.membership m
        JOIN neiist.valid_department_roles vdr
            ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
        WHERE m.user_istid = u_user_istid
          AND vdr.access = current_access
          AND NOT (m.department_name = u_department_name AND m.role_name = u_role_name)
    ) THEN
        DELETE FROM neiist.user_access_roles WHERE user_istid = u_user_istid AND access = current_access;
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

CREATE OR REPLACE FUNCTION neiist.get_all_users()
RETURNS TABLE (
    istid VARCHAR(10),
    name TEXT,
    email TEXT,
    phone VARCHAR(15),
    courses TEXT[],
    photo_path TEXT,
    role TEXT,
    teams TEXT[]
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
        CASE 
            WHEN 'admin' = ANY(COALESCE(access_levels.access_array, ARRAY[]::neiist.user_access_enum[])) THEN 'admin'
            WHEN 'coordinator' = ANY(COALESCE(access_levels.access_array, ARRAY[]::neiist.user_access_enum[])) THEN 'coordinator'
            WHEN 'member' = ANY(COALESCE(access_levels.access_array, ARRAY[]::neiist.user_access_enum[])) THEN 'member'
            ELSE 'guest'
        END as role,
        COALESCE(user_teams.teams_array, ARRAY[]::TEXT[]) as teams
    FROM neiist.users u
    LEFT JOIN (
        SELECT 
            uar.user_istid,
            array_agg(uar.access) as access_array
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
            WHEN 'admin' = ANY(COALESCE(access_levels.access_array, ARRAY[]::neiist.user_access_enum[])) THEN 1
            WHEN 'coordinator' = ANY(COALESCE(access_levels.access_array, ARRAY[]::neiist.user_access_enum[])) THEN 2
            WHEN 'member' = ANY(COALESCE(access_levels.access_array, ARRAY[]::neiist.user_access_enum[])) THEN 3
            ELSE 4
        END,
        u.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- BLOG/NEWS TABLE
CREATE TABLE neiist.news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    author TEXT NOT NULL,
    tag TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
