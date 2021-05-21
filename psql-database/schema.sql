-- this database needs to have the western europe encoding
-- CREATE DATABASE thesis_master WITH ENCODING 'WIN1252' LC_COLLATE 'C' LC_CTYPE 'C' TEMPLATE=template0;
-- pt_PT.UTF-8 UTF-8
-- pt_PT ISO-8859-1
-- pt_PT@euro ISO-8859-15
-- NOTE: make sure that the server and client encoding are the same, verify with: SHOW server_encoding; SHOW client_encoding;

DROP TABLE IF EXISTS areas CASCADE;
CREATE TABLE areas (
    code varchar(10) PRIMARY KEY,
    short varchar(10),
    long varchar(100)
);

DROP TABLE IF EXISTS theses CASCADE;
CREATE TABLE theses (
    id integer PRIMARY KEY,
    title text,
    supervisors text[],
    vacancies integer,
    location text,
    observations text,
    objectives text,
    requirements text,
    area1 varchar(10) REFERENCES areas (code) ON DELETE CASCADE ON UPDATE CASCADE,
    area2 varchar(10) REFERENCES areas (code) ON DELETE CASCADE ON UPDATE CASCADE
);