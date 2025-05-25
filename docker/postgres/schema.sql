-- Create custom schemas if they don't exist
CREATE SCHEMA IF NOT EXISTS members;
CREATE SCHEMA IF NOT EXISTS neilist;

-- Table: public.users
CREATE TABLE public.users (
  istid VARCHAR(10) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone VARCHAR(15),
  courses TEXT[],
  campus CHAR(15),
  permission TEXT,
  photo OID -- OID reference to the large object
);

-- Table: members.members
CREATE TABLE members.members (
  istid VARCHAR(10) PRIMARY KEY REFERENCES public.users(istid),
  register_date DATE NOT NULL,
  elector_date DATE NOT NULL,
  start_renewal_date DATE,
  end_renewal_date DATE,
  renewal_notification BOOLEAN DEFAULT FALSE
);

-- Table: neilist.collaborators
CREATE TABLE neilist.collaborators (
  istid VARCHAR(10),
  teams TEXT[] NOT NULL,
  role TEXT NOT NULL,
  subRole TEXT,
  fromDate DATE NOT NULL,
  toDate DATE NOT NULL,
  PRIMARY KEY (istid, fromDate),
  FOREIGN KEY (istid) REFERENCES public.users(istid)
);
