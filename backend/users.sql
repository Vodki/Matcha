CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name    TEXT NOT NULL,
    last_name     TEXT NOT NULL,
    username      TEXT UNIQUE NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    gender        TEXT,
    orientation   TEXT,
    birthday      DATE,
    bio           TEXT,
    avatar_url    TEXT
);