CREATE SCHEMA IF NOT EXISTS neiist;

CREATE TYPE neiist.team_role_enum AS ENUM (
  'COOR-DEV',
  'DEV',
  'COOR-FOTO',
  'FOTO',
  'COOR-MARKETING',
  'MARKETING',
  'COOR-EVENTS',
  'EVENTS',
  'COOR-SOCIAL',
  'SOCIAL',
  'COOR-LOGISTICS',
  'LOGISTICS'
);

-- Table: public.users --
CREATE TABLE public.users (
  istid VARCHAR(10) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone VARCHAR(15),
  courses TEXT[],
  campus CHAR(15),
  photo OID
);

-- Table: neiist.roles --
CREATE TABLE neiist.roles (
  istid VARCHAR(10) REFERENCES public.users(istid),
  role_type TEXT NOT NULL CHECK (role_type IN ('member', 'collaborator', 'admin')),
  
  -- Member-specific fields --
  register_date DATE,
  elector_date DATE,
  start_renewal_date DATE,
  end_renewal_date DATE,
  renewal_notification BOOLEAN DEFAULT FALSE,
  
  -- Collaborator-specific fields --
  teams neiist.team_role_enum[],
  position TEXT,
  from_date DATE,
  to_date DATE,
  
  PRIMARY KEY (istid, role_type)
);

CREATE INDEX idx_neiist_roles_type ON neiist.roles (role_type);
CREATE INDEX idx_neiist_roles_dates ON neiist.roles (from_date, to_date) WHERE role_type = 'collaborator';

-- Function to get available team roles --
CREATE OR REPLACE FUNCTION neiist.get_available_team_roles()
RETURNS neiist.team_role_enum[] AS $$
BEGIN
  RETURN ARRAY(SELECT unnest(enum_range(NULL::neiist.team_role_enum)));
END;
$$ LANGUAGE plpgsql;

-- Function to add new team role enum value --
CREATE OR REPLACE FUNCTION neiist.add_team_role(new_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  EXECUTE format('ALTER TYPE neiist.team_role_enum ADD VALUE %L', new_role);
  RETURN TRUE;
EXCEPTION
  WHEN duplicate_object THEN
    RETURN FALSE;
  WHEN others THEN
    RAISE EXCEPTION 'Error adding team role: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a user is admin
CREATE OR REPLACE FUNCTION neiist.is_admin(user_istid VARCHAR(10))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM neiist.roles 
        WHERE istid = user_istid AND role_type = 'admin'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to add an admin user
CREATE OR REPLACE FUNCTION neiist.add_admin_user(user_istid VARCHAR(10))
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user exists in users table
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE istid = user_istid) THEN
        RAISE EXCEPTION 'User % does not exist', user_istid;
    END IF;
    
    -- Insert admin role (ON CONFLICT DO NOTHING to handle duplicates)
    INSERT INTO neiist.roles (istid, role_type)
    VALUES (user_istid, 'admin')
    ON CONFLICT (istid, role_type) DO NOTHING;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to remove an admin user
CREATE OR REPLACE FUNCTION neiist.remove_admin_user(user_istid VARCHAR(10))
RETURNS BOOLEAN AS $$
BEGIN
    -- Remove admin role from roles table
    DELETE FROM neiist.roles 
    WHERE istid = user_istid AND role_type = 'admin';
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get all admin users
CREATE OR REPLACE FUNCTION neiist.get_admin_users()
RETURNS TABLE (
    istid VARCHAR(10),
    name TEXT,
    email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.istid,
        u.name,
        u.email
    FROM neiist.roles r
    JOIN public.users u ON r.istid = u.istid
    WHERE r.role_type = 'admin'
    ORDER BY u.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get team roles as formatted objects for API
CREATE OR REPLACE FUNCTION neiist.get_team_roles_formatted()
RETURNS TABLE (
    value TEXT,
    label TEXT,
    is_coordinator BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        role_enum::TEXT as value,
        CASE 
            WHEN role_enum::TEXT LIKE 'COOR-%' THEN 
                'Coordinator - ' || REPLACE(role_enum::TEXT, 'COOR-', '')
            ELSE 
                role_enum::TEXT
        END as label,
        role_enum::TEXT LIKE 'COOR-%' as is_coordinator
    FROM unnest(enum_range(NULL::neiist.team_role_enum)) as role_enum
    ORDER BY is_coordinator DESC, role_enum::TEXT;
END;
$$ LANGUAGE plpgsql;
