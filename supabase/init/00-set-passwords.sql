-- Set passwords for all supabase roles to match POSTGRES_PASSWORD env var
-- This runs as part of the docker-entrypoint-initdb.d scripts
ALTER ROLE supabase_auth_admin WITH PASSWORD :'PGPASSWORD';
ALTER ROLE supabase_storage_admin WITH PASSWORD :'PGPASSWORD';
ALTER ROLE authenticator WITH PASSWORD :'PGPASSWORD';
ALTER ROLE supabase_admin WITH PASSWORD :'PGPASSWORD';
ALTER ROLE postgres WITH PASSWORD :'PGPASSWORD';
-- Create supabase role for pg-meta
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase') THEN
    EXECUTE format('ALTER ROLE supabase WITH PASSWORD %L', current_setting('custom.pgpassword', true));
  ELSE
    EXECUTE format('CREATE ROLE supabase WITH LOGIN PASSWORD %L SUPERUSER', current_setting('custom.pgpassword', true));
  END IF;
END $$;
