import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClassSessionsTable1766690785316 implements MigrationInterface {
  name = 'CreateClassSessionsTable1766690785316';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "class_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "start_time" TIME, "end_time" TIME, "notes" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "classId" uuid, "teacherId" uuid, CONSTRAINT "PK_dc034da48c6e0cf95c51f606c4e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_sessions" ADD CONSTRAINT "FK_a25b83aafc81c493286637c6bb8" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_sessions" ADD CONSTRAINT "FK_65621dccf831fc3765dfeeae25d" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "class_sessions" DROP CONSTRAINT "FK_65621dccf831fc3765dfeeae25d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_sessions" DROP CONSTRAINT "FK_a25b83aafc81c493286637c6bb8"`,
    );
    await queryRunner.query(`DROP TABLE "class_sessions"`);
  }
}
