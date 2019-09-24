CREATE KEYSPACE "infs3208" WITH replication = { 'class': 'SimpleStrategy', 'replication_factor':'3' };

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
