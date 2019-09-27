-- SECURITY --

ALTER KEYSPACE system_auth WITH replication = { 'class': 'SimpleStrategy', 'replication_factor': 3 };

-- KEYSPACE --

CREATE KEYSPACE "infs3208" WITH replication = { 'class': 'SimpleStrategy', 'replication_factor': 3 };

-- TYPES --

CREATE TYPE infs3208.class_session (
    start_time time,
    end_time time,
    location text,
    day int
);

CREATE TYPE infs3208.class_stream (
    weeks set<int>,
    streams set<frozen<infs3208.class_session>>
);

CREATE TYPE infs3208.class (
    name text,
    streams list<frozen<infs3208.class_stream>>
);

-- TABLES --

CREATE TABLE infs3208.subject_offering (
    name text,
    year int,
    semester int,
    classes set<frozen<infs3208.class>>,
    PRIMARY KEY (name, year, semester)
);

CREATE TABLE infs3208.semester (
    year int,
    semester int,
    active boolean,
    weeks map<int, date>,active
    PRIMARY KEY(year, semester)
);

CREATE INDEX active_semesters ON infs3208.semester (active);

INSERT INTO infs3208.semester (active, semester, weeks, year)
VALUES (
    true,
    2,
    {
        1: '2019-07-22',
        2: '2019-07-29',
        3: '2019-08-05',
        4: '2019-08-12',
        5: '2019-08-19',
        6: '2019-08-26',
        7: '2019-09-02',
        8: '2019-09-09',
        9: '2019-09-16',
        10: '2019-09-23',
        11: '2019-10-07',
        12: '2019-10-14',
        13: '2019-10-21'
    },
    2019
);
