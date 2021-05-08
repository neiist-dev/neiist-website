-- this database needs to have the western europe encoding
-- CREATE DATABASE thesis_master WITH ENCODING 'WIN1252' TEMPLATE=template0;

DROP TABLE IF EXISTS courses CASCADE;
CREATE TABLE courses (
    code varchar(10) PRIMARY KEY,
    short varchar(10),
    long varchar(100),
    campus varchar(25)
);


DROP TABLE IF EXISTS areas CASCADE;
CREATE TABLE areas (
    code varchar(10) PRIMARY KEY,
    short varchar(10),
    long varchar(100)
);


DROP TYPE IF EXISTS tstatus CASCADE;
CREATE TYPE tstatus AS ENUM ('assigned', 'not assigned', 'other');


DROP TABLE IF EXISTS theses CASCADE;
CREATE TABLE theses (
    id integer PRIMARY KEY,
    title varchar(100),
    supervisors text[],
    vacancies integer,
    location text,
    observations text,
    objectives text,
    status tstatus,
    requirements text,
    area1 varchar(10) REFERENCES areas (code) ON DELETE CASCADE ON UPDATE CASCADE,
    area2 varchar(10) REFERENCES areas (code) ON DELETE CASCADE ON UPDATE CASCADE
);


DROP TABLE IF EXISTS area_course CASCADE;
CREATE TABLE area_course (
    area_code varchar(10) REFERENCES areas(code) ON DELETE CASCADE ON UPDATE CASCADE,
    course_code varchar(10) REFERENCES courses(code) ON DELETE CASCADE ON UPDATE CASCADE
);


DROP TABLE IF EXISTS thesis_course;
CREATE TABLE thesis_course (
    thesis_id integer REFERENCES theses (id) ON DELETE CASCADE ON UPDATE CASCADE,
    course_code varchar(10) REFERENCES courses (code) ON DELETE CASCADE ON UPDATE CASCADE
);
