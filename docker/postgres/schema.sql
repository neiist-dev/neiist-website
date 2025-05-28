-- Create custom schemas if they don't exist
CREATE SCHEMA IF NOT EXISTS neiist;

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

-- Table: neiist.roles (for members and collaborators)
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
  teams TEXT[],
  position TEXT,
  from_date DATE,
  to_date DATE,
  
  PRIMARY KEY (istid, role_type)
);

-- Index for better query performance
CREATE INDEX idx_neiist_roles_type ON neiist.roles (role_type);
CREATE INDEX idx_neiist_roles_dates ON neiist.roles (from_date, to_date) WHERE role_type = 'collaborator';