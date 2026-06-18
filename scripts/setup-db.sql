DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'teacherflow') THEN
    CREATE ROLE teacherflow LOGIN PASSWORD 'teacherflow' CREATEDB;
  END IF;
END $$;

SELECT 'role ok' AS step;
