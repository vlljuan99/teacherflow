-- Run inside tilestudio-postgres-1 against teacherflow_main as teacherflow_app.
-- Idempotent.

-- 1. Real teacher: fix the name on the velascom469 account (was "Profesora Victoria"
--    from a wrong assumption when it was provisioned).
UPDATE "User"
SET "name" = 'Marta',
    "isActive" = true,
    "role" = 'TEACHER',
    "updatedAt" = NOW()
WHERE email = 'velascom469@gmail.com';

-- 2. Admin (Juan, the developer). TEACHER is the highest role in this app, so
--    this gives the same "see everything" view as Marta.
INSERT INTO "User" (id, email, name, role, locale, "isActive", "createdAt", "updatedAt")
SELECT
  'cm' || lpad(to_hex((extract(epoch from now())*1000)::bigint), 16, '0') || substr(md5(random()::text), 1, 8),
  'jvillegasllano@gmail.com',
  'Juan Villegas',
  'TEACHER',
  'es',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "User" WHERE email = 'jvillegasllano@gmail.com'
);

UPDATE "User"
SET "role" = 'TEACHER',
    "name" = COALESCE(NULLIF("name", ''), 'Juan Villegas'),
    "isActive" = true,
    "updatedAt" = NOW()
WHERE email = 'jvillegasllano@gmail.com';

-- 3. Placeholder teacher: leave inactive (preserve historical records like
--    audit logs / uploaded materials that reference this id).
UPDATE "User"
SET "isActive" = false,
    "updatedAt" = NOW()
WHERE email = 'marta.profe@teacherflow.local';

SELECT email, name, role, "isActive" FROM "User" ORDER BY role, email;
