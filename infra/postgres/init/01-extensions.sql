-- Enables the extensions the shell relies on (postgresql plan). Runs once, on an
-- empty data directory, as the superuser against the default database. Kept in
-- sync with the EF "enable extensions" migration so managed-Postgres compatibility
-- (which applies the migration, not this script) stays checkable.
CREATE EXTENSION IF NOT EXISTS pg_trgm;            -- trigram search (search module)
CREATE EXTENSION IF NOT EXISTS citext;             -- case-insensitive emails
CREATE EXTENSION IF NOT EXISTS pgcrypto;           -- crypto helpers where needed
CREATE EXTENSION IF NOT EXISTS pg_stat_statements; -- slow-query visibility (observability)
