import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttendancesTable1766691164315 implements MigrationInterface {
  name = 'CreateAttendancesTable1766691164315';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."attendances_status_enum" AS ENUM('pending', 'present', 'late', 'absent', 'excused')`,
    );
    await queryRunner.query(
      `CREATE TABLE "attendances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "is_enrolled_class" boolean NOT NULL DEFAULT true, "status" "public"."attendances_status_enum" NOT NULL DEFAULT 'pending', "checked_in_at" TIMESTAMP, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "sessionId" uuid, "studentId" uuid, CONSTRAINT "PK_483ed97cd4cd43ab4a117516b69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendances" ADD CONSTRAINT "FK_d5140a0a7ab7511a8d326eef004" FOREIGN KEY ("sessionId") REFERENCES "class_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendances" ADD CONSTRAINT "FK_615b414059091a9a8ea0355ae89" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attendances" DROP CONSTRAINT "FK_615b414059091a9a8ea0355ae89"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendances" DROP CONSTRAINT "FK_d5140a0a7ab7511a8d326eef004"`,
    );
    await queryRunner.query(`DROP TABLE "attendances"`);
    await queryRunner.query(`DROP TYPE "public"."attendances_status_enum"`);
  }
}
