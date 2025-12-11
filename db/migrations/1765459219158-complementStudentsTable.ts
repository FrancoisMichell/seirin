import { MigrationInterface, QueryRunner } from "typeorm";

export class ComplementStudentsTable1765459219158 implements MigrationInterface {
    name = 'ComplementStudentsTable1765459219158'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."student_belt_enum" AS ENUM('White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black')`);
        await queryRunner.query(`ALTER TABLE "student" ADD "belt" "public"."student_belt_enum" NOT NULL DEFAULT 'White'`);
        await queryRunner.query(`ALTER TABLE "student" ADD "birthday" date`);
        await queryRunner.query(`ALTER TABLE "student" ADD "training_since" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "training_since"`);
        await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "birthday"`);
        await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "belt"`);
        await queryRunner.query(`DROP TYPE "public"."student_belt_enum"`);
    }

}
