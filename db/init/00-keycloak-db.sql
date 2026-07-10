-- Runs once on first initialization of the `db` container (postgres official
-- image executes /docker-entrypoint-initdb.d/*.sql in alphabetical order).
-- Gives Keycloak its own database inside the same PostgreSQL instance so the
-- Identity Provider never falls back to the embedded H2 store (anti-pattern).
-- The CRM application schema lives in the default POSTGRES_DB and is created by
-- the API's migration runner (see services/api/src/db/migrate.ts).
SELECT 'CREATE DATABASE keycloak'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak')\gexec
