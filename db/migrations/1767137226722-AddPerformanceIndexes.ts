import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1767137226722 implements MigrationInterface {
  name = 'AddPerformanceIndexes1767137226722';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_615b414059091a9a8ea0355ae8" ON "attendances" ("studentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d5140a0a7ab7511a8d326eef00" ON "attendances" ("sessionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_633f525bb5fdbd18680c351711" ON "class_sessions" ("is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_323855e6a95fe68b3620048752" ON "class_sessions" ("date", "classId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20597584a57ca52188198d5ea4" ON "classes" ("is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4b7ac7a7eb91f3e04229c7c0b6" ON "classes" ("teacherId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20c7aea6112bef71528210f631" ON "users" ("is_active") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_20c7aea6112bef71528210f631"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4b7ac7a7eb91f3e04229c7c0b6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_20597584a57ca52188198d5ea4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_323855e6a95fe68b3620048752"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_633f525bb5fdbd18680c351711"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d5140a0a7ab7511a8d326eef00"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_615b414059091a9a8ea0355ae8"`,
    );
  }
}
