import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClassesTable1766360366481 implements MigrationInterface {
  name = 'CreateClassesTable1766360366481';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "days" text NOT NULL, "startTime" TIME NOT NULL, "durationMinutes" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "teacherId" uuid, CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "class_enrollments" ("class_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_94401876d965cc28d5ed0ab3693" PRIMARY KEY ("class_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dfd6aaba34336d3c77b06c5038" ON "class_enrollments" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3e55346a50b96acf9006b4e8f1" ON "class_enrollments" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ADD CONSTRAINT "FK_4b7ac7a7eb91f3e04229c7c0b6f" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_enrollments" ADD CONSTRAINT "FK_dfd6aaba34336d3c77b06c5038c" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_enrollments" ADD CONSTRAINT "FK_3e55346a50b96acf9006b4e8f15" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "class_enrollments" DROP CONSTRAINT "FK_3e55346a50b96acf9006b4e8f15"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_enrollments" DROP CONSTRAINT "FK_dfd6aaba34336d3c77b06c5038c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" DROP CONSTRAINT "FK_4b7ac7a7eb91f3e04229c7c0b6f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3e55346a50b96acf9006b4e8f1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dfd6aaba34336d3c77b06c5038"`,
    );
    await queryRunner.query(`DROP TABLE "class_enrollments"`);
    await queryRunner.query(`DROP TABLE "classes"`);
  }
}
