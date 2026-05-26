-- Role devient une identite PLATEFORME : { ADMIN, CLIENT }.
-- owner / member sont desormais des RELATIONS (Organization.ownerId / table Member),
-- plus des roles. On retire donc OWNER et MEMBER de l'enum.

-- 1. Migrer les lignes existantes AVANT de retirer les valeurs,
--    sinon le cast vers le nouvel enum echoue (OWNER/MEMBER n'existeraient plus).
UPDATE "user" SET "role" = 'CLIENT' WHERE "role" IN ('OWNER', 'MEMBER');

-- 2. Recreation du type : Postgres ne sait pas retirer une valeur d'enum directement.
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'CLIENT');
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'CLIENT';
