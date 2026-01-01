import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInstructorToUsers1767281639863 implements MigrationInterface {
  name = 'AddInstructorToUsers1767281639863';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "instructor_id" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_ee3e60b8d4c3582d10d86e4679" ON "users" ("instructor_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_ee3e60b8d4c3582d10d86e46796" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_ee3e60b8d4c3582d10d86e46796"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ee3e60b8d4c3582d10d86e4679"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "instructor_id"`);
  }
}
