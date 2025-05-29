-- Create custom schemas if they don't exist
CREATE SCHEMA IF NOT EXISTS neiist;

-- Create enum for team roles (easily expandable)
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

-- Table: public.users (for all users)
CREATE TABLE public.users (
  istid VARCHAR(10) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone VARCHAR(15),
  courses TEXT[],
  campus CHAR(15),
  photo OID -- OID reference to the large object
);

-- Table: neiist.roles (for members, collaborators, and admins)
CREATE TABLE neiist.roles (
  istid VARCHAR(10) REFERENCES public.users(istid),
  role_type TEXT NOT NULL CHECK (role_type IN ('member', 'collaborator', 'admin')),
  
  -- Member-specific fields
  register_date DATE,
  elector_date DATE,
  start_renewal_date DATE,
  end_renewal_date DATE,
  renewal_notification BOOLEAN DEFAULT FALSE,
  
  -- Collaborator-specific fields
  teams neiist.team_role_enum[], -- Array of team roles (changed from TEXT to enum)
  position TEXT,
  from_date DATE,
  to_date DATE,
  
  PRIMARY KEY (istid, role_type)
);

-- Index for better query performance
CREATE INDEX idx_neiist_roles_type ON neiist.roles (role_type);
CREATE INDEX idx_neiist_roles_dates ON neiist.roles (from_date, to_date) WHERE role_type = 'collaborator';

-- Function to get available team roles (for frontend dropdown)
CREATE OR REPLACE FUNCTION neiist.get_available_team_roles()
RETURNS neiist.team_role_enum[] AS $$
BEGIN
  RETURN ARRAY(SELECT unnest(enum_range(NULL::neiist.team_role_enum)));
END;
$$ LANGUAGE plpgsql;

-- Function to add new team role enum value (for easy expansion)
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