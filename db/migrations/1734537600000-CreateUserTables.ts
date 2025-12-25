import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTables1734537600000 implements MigrationInterface {
  name = 'CreateUserTables1734537600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_roles_role_enum" AS ENUM('student', 'teacher')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."user_roles_role_enum" NOT NULL, "userId" uuid, CONSTRAINT "UQ_5f9286e6c25594c6b88c108db77" UNIQUE ("userId", "role"), CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_belt_enum" AS ENUM('White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "registry" character varying NOT NULL, "password" character varying NOT NULL, "belt" "public"."users_belt_enum" NOT NULL DEFAULT 'White', "birthday" date, "training_since" date, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d3cc7230fc08ea2d6e7a5edc358" UNIQUE ("registry"), CONSTRAINT "UQ_d3cc7230fc08ea2d6e7a5edc358" UNIQUE ("registry"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_472b25323af01488f1f66a06b67" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_472b25323af01488f1f66a06b67"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_belt_enum"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TYPE "public"."user_roles_role_enum"`);
  }
}
