--- SCHEMAS ---
CREATE SCHEMA IF NOT EXISTS neiist;
CREATE SCHEMA IF NOT EXISTS members;
CREATE SCHEMA IF NOT EXISTS elections;
CREATE SCHEMA IF NOT EXISTS thesis_master;

--- Users Table ---
CREATE TABLE IF NOT EXISTS public.users (
  "istId" varchar(10) PRIMARY KEY CHECK ("istId" like 'ist%'),
  name text NOT NULL,
  email text NOT NULL,
  phone varchar(15),
  courses text[] DEFAULT ARRAY['STUDENT'] NOT NULL,
  campus varchar(1) CHECK (campus in ('A', 'T', NULL)),
  permission text[] DEFAULT '{}' NOT NULL
);

--- NEIIST Collabs Table & Views ---
CREATE TABLE neiist.collaborators(
  "istId" varchar(10) REFERENCES public.users("istId"),
  teams text[] NOT NULL,
  role text DEFAULT 'COLLAB' NOT NULL,
  "subRole" text,
  "fromDate" date DEFAULT CURRENT_DATE NOT NULL,
  "toDate" date DEFAULT '9999-12-31' NOT NULL,

  PRIMARY KEY ("istId", "fromDate", "toDate")
);

CREATE OR REPLACE VIEW neiist.curr_collaborators AS
  SELECT *
  FROM neiist.collaborators
  WHERE "fromDate" <= current_date::date
    AND "toDate" > current_date::date;

CREATE OR REPLACE VIEW neiist.coordenators AS
  SELECT *
  FROM neiist.curr_collaborators
   WHERE (SELECT unnest("teams")) LIKE '%COOR%';

DROP VIEW IF EXISTS public.admins CASCADE;
DROP VIEW IF EXISTS public.gac_members CASCADE;
DROP VIEW IF EXISTS public."gacMembers" CASCADE;

CREATE OR REPLACE VIEW public.admins AS
  SELECT "istId"
  FROM public.users
  WHERE 'admin'=ANY(permission);

CREATE OR REPLACE VIEW public.gac_members AS
  SELECT "istId"
  FROM public.users
  WHERE 'gac'=ANY(permission)
    OR 'admin'=ANY(permission);

--- NEIIST Members Tables ---
CREATE TABLE members.users(
  "istId" varchar(10) PRIMARY KEY REFERENCES public.users("istId"),
  "registerDate" date NOT NULL,
  "electorDate" date NOT NULL,
  "startRenewalDate" date,
  "endRenewalDate" date,
  "renewalNotification" boolean DEFAULT FALSE
);

CREATE OR REPLACE VIEW members.curr_members AS
  SELECT *
  FROM members.users
  WHERE "endRenewalDate" >= CURRENT_DATE::date;

--- Elections Tables ---
CREATE TABLE elections.events(
  id serial PRIMARY KEY,
  name text,
  "startDate" date,
  "endDate" date
);

CREATE TABLE elections.options(
  id serial PRIMARY KEY,
  name text,
  "electionId" INTEGER REFERENCES elections.events(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE elections.votes(
  "istId" varchar(10) REFERENCES public.users("istId"),
  "electionId" INTEGER REFERENCES elections.events(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "optionId" INTEGER REFERENCES elections.options(id) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY ("istId", "electionId")
);

--- Thesis Master Tables ---
CREATE TABLE thesis_master.areas (
  code varchar(10) PRIMARY KEY,
  short varchar(10),
  long text
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


-- INSERT DATA --
INSERT INTO thesis_master.areas (code, short, long)
SELECT code, short, long FROM public.areas;

INSERT INTO thesis_master.theses (id, title, supervisors, vacancies, location, observations, objectives, requirements, area1, area2)
SELECT id, title, supervisors, vacancies, location, observations, objectives, requirements, area1, area2 FROM public.theses;

DROP TABLE areas CASCADE;
DROP TABLE theses CASCADE;


INSERT INTO elections.events (id, name, "startDate", "endDate")
SELECT id, name, "startDate", "endDate" FROM public.elections;

INSERT INTO elections.options (id, name, "electionId")
SELECT id, name, "electionId" FROM public.options;

INSERT INTO elections.votes ("istId", "electionId", "optionId")
SELECT username, "electionId", "optionId" FROM public.votes;

DROP TABLE options CASCADE;
DROP TABLE votes CASCADE;
DROP TABLE elections CASCADE;


INSERT INTO public.users ("istId", name, email, courses, campus)
SELECT
  allUsers.username as "istId",
  CASE
    WHEN members.name IS NULL OR members.name = '' 
    THEN 'N/A'
    ELSE members.name END AS name,
  CASE
    WHEN members.email IS NULL OR members.email = '' 
    THEN CONCAT(allUsers.username,'@tecnico.ulisboa.pt')
    ELSE members.email END AS email,
  CASE
    WHEN members.courses IS NULL OR members.courses = '' 
    THEN ARRAY['STUDENT']
    ELSE string_to_array(members.courses, ',') END AS courses,
  CASE
    WHEN lastRecords.campus IS NOT NULL OR lastRecords.campus = '' 
    THEN lastRecords.campus
    WHEN (SELECT COUNT(*) FROM unnest(string_to_array(members.courses,',')) AS course WHERE course LIKE any (array['%-A%', '%EEC%', '%EQ%'])) > 0
    THEN 'A'
    WHEN (SELECT COUNT(*) FROM unnest(string_to_array(members.courses,',')) AS course WHERE course LIKE any (array['%-T%', '%EGI%', '%ERC%', '%EE%'])) > 0
    THEN 'T'
    ELSE ''
  END AS campus
FROM
  (
    SELECT DISTINCT members.username as username
    FROM public.members

    UNION

    SELECT DISTINCT collaborators.username as username
    FROM public.collaborators

  ) as allUsers
  FULL OUTER JOIN public.members ON allUsers.username = members.username
  FULL OUTER JOIN (
    SELECT *
    FROM public.collaborators as cc 
    NATURAL JOIN (
      SELECT cc.username, MAX(cc."toDate") as "toDate"
      FROM public.collaborators AS cc
      GROUP BY cc."username"
      ORDER BY "toDate" DESC
    ) as lastRecords
  ) lastRecords ON allUsers.username = lastRecords.username
ORDER BY length(allUsers.username), allUsers.username ASC;

INSERT INTO members.users("istId", "registerDate", "electorDate", "startRenewalDate", "endRenewalDate", "renewalNotification")
SELECT 
  username as "istId",
  "registerDate"::date,
  "canVoteDate"::date as "electorDate",
  "renewStartDate"::date as "startRenewalDate",
  "renewEndDate"::date as "endRenewalDate",
  (public.members.username IN (
      SELECT username FROM public."renewalNotifications"
    ))::boolean as "renewalNotification"
FROM public.members;

INSERT INTO neiist.collaborators("istId", teams, "role", "subRole", "fromDate", "toDate")
SELECT
  username as "istId",
  string_to_array(teams,',') as "teams",
  "role",
  "subRole",
  "fromDate",
  "toDate"
FROM public.collaborators;

DROP TABLE members CASCADE;
DROP TABLE collaborators CASCADE;
DROP TABLE "renewalNotifications" CASCADE;


UPDATE public.users SET permission = ARRAY_APPEND(permission, 'admin') WHERE "istId" IN (
  SELECT "istId"
  FROM neiist.curr_collaborators as cc
    NATURAL JOIN --TODO: check if this is correct
    public.users as us
  WHERE (
    (EXISTS (SELECT 1 FROM unnest("teams") t WHERE t LIKE 'COOR-DEV'))
  )
);

UPDATE public.users SET permission = ARRAY_APPEND(permission, 'gac') WHERE "istId" IN (
  SELECT "istId"
  FROM neiist.curr_collaborators as cc
    NATURAL JOIN --TODO: check if this is correct
    public.users as us
  WHERE (
    (NOT EXISTS (SELECT 1 FROM unnest("teams") t WHERE t LIKE '%SINFO%') AND "role" LIKE 'Direção%')
    OR ("role" LIKE 'MAG%' AND "subRole" LIKE '%Presidente%')
  )
);