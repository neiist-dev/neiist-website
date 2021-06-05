-- CREATE DATABASE neiistdb;        // UTF-8

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