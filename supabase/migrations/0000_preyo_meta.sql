CREATE SCHEMA IF NOT EXISTS preyo_meta;

CREATE TABLE IF NOT EXISTS preyo_meta.migration_history
(
    id         bigserial PRIMARY KEY,
    filename   text        NOT NULL UNIQUE,
    checksum   text        NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);