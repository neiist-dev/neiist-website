-- TODO: Add shop and blog tables. And getter functions.

-- SCHEMA
CREATE SCHEMA IF NOT EXISTS neiist;

-- ROLES
CREATE ROLE neiist_app_user WITH LOGIN PASSWORD 'neiist_app_user_password';
REVOKE ALL ON ALL TABLES IN SCHEMA neiist FROM neiist_app_user;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA neiist FROM neiist_app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA neiist TO neiist_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA neiist GRANT EXECUTE ON FUNCTIONS TO neiist_app_user;

-- ENUM TYPES
CREATE TYPE neiist.user_access_enum AS ENUM (
    'admin',
    'coordinator',
    'member',
);

-- USERS TABLE
CREATE TABLE neiist.users (
    istid VARCHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone VARCHAR(15),
    courses TEXT[],
    campus TEXT,
    photo OID
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

-- Add user
CREATE OR REPLACE FUNCTION neiist.add_user(
    u_istid VARCHAR(10),
    u_name TEXT,
    u_email TEXT,
    u_phone VARCHAR(15),
    u_courses TEXT[],
    u_campus TEXT,
    u_photo OID
) RETURNS VOID AS $$
BEGIN
    INSERT INTO neiist.users (istid, name, email, phone, courses, campus, photo)
    VALUES (u_istid, u_name, u_email, u_phone, u_courses, u_campus, u_photo);
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
