--- SCHEMAS ---
CREATE SCHEMA IF NOT EXISTS neiist;
CREATE SCHEMA IF NOT EXISTS members;
CREATE SCHEMA IF NOT EXISTS elections;
CREATE SCHEMA IF NOT EXISTS thesis_master;

--- Users Table ---
CREATE TABLE IF NOT EXISTS public.users (
  istid varchar(10) PRIMARY KEY CHECK (istid like 'ist%'),
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(20),
  courses varchar(33) DEFAULT 'STUDENT' NOT NULL,
  campus varchar(1) NOT NULL CHECK (campus in ('A', 'T'))
);

--- NEIIST Collabs Table & Views ---
CREATE TABLE neiist.collaborators(
  istid varchar(10) REFERENCES public.users(istid),
  teams varchar(200) NOT NULL,
  role varchar(17) DEFAULT 'COLLAB' NOT NULL,
  "subRole" varchar(100),
  "fromDate" date DEFAULT CURRENT_DATE NOT NULL,
  "toDate" date DEFAULT '9999-12-31' NOT NULL,

  PRIMARY KEY ("istid", "fromDate", "toDate")
);

--- NEIIST Members Tables ---
CREATE TABLE members.users(
  istid varchar(10) PRIMARY KEY REFERENCES public.users(istid),
  "registerDate" date NOT NULL,
  "electorDate" date NOT NULL,
  "startRenewalDate" date,
  "endRenewalDate" date
);

CREATE TABLE members.renewal_notifications (
  istid varchar(10) PRIMARY KEY REFERENCES members.users(istid)
);

-- Triggers --
CREATE OR REPLACE FUNCTION delete_unused_dates()
RETURNS TRIGGER AS $$
  BEGIN
      UPDATE members.users
      SET "startRenewalDate" = NULL, "endRenewalDate" = NULL
      WHERE "endRenewalDate" < CURRENT_DATE;
      RETURN NULL;
  END;
  $$ LANGUAGE plpgsql;

CREATE TRIGGER delete_unused_dates_trigger
BEFORE INSERT OR UPDATE ON members.users
FOR EACH ROW
EXECUTE FUNCTION delete_unused_dates();

CREATE OR REPLACE FUNCTION remove_expired_warned_users()
RETURNS TRIGGER AS $$
  BEGIN
    DELETE FROM members.renewal_notifications
    WHERE istid IN (
      SELECT istid FROM members.users WHERE "endRenewalDate" < CURRENT_DATE
    );
    RETURN NULL;
  END;
  $$ LANGUAGE plpgsql;

CREATE TRIGGER remove_expired_warned_users_trigger
AFTER INSERT OR UPDATE ON members.renewal_notifications
FOR EACH ROW
EXECUTE FUNCTION remove_expired_warned_users();

--- Elections Tables ---
CREATE TABLE elections.events(
  id serial PRIMARY KEY,
  name varchar(100),
  "startDate" date,
  "endDate" date
);

CREATE TABLE elections.options(
  id serial PRIMARY KEY,
  name varchar(100),
  "electionId" INTEGER REFERENCES elections.events(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE elections.votes(
  istid varchar(10) REFERENCES public.users(istid),
  "electionId" INTEGER REFERENCES elections.events(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "optionId" INTEGER REFERENCES elections.options(id) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (istid, "electionId")
);

--- Thesis Master Tables ---
CREATE TABLE thesis_master.areas (
  code varchar(10) PRIMARY KEY,
  short varchar(10),
  long varchar(100)
);

CREATE TABLE thesis_master.theses(
  id integer PRIMARY KEY,
  title text,
  supervisors text[],
  vacancies integer,
  location text,
  observations text,
  objectives text,
  requirements text,
  area1 varchar(10) REFERENCES thesis_master.areas(code) ON DELETE CASCADE ON UPDATE CASCADE,
  area2 varchar(10) REFERENCES thesis_master.areas(code) ON DELETE CASCADE ON UPDATE CASCADE
);