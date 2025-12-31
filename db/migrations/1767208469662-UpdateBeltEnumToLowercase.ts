import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBeltEnumToLowercase1767208469662 implements MigrationInterface {
  name = 'UpdateBeltEnumToLowercase1767208469662';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop default temporarily
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "belt" DROP DEFAULT`,
    );

    // Step 2: Convert column to text to allow data manipulation
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "belt" TYPE text USING "belt"::text`,
    );

    // Step 3: Update existing data to lowercase
    await queryRunner.query(`UPDATE "users" SET "belt" = LOWER("belt")`);

    // Step 4: Rename old enum
    await queryRunner.query(
      `ALTER TYPE "public"."users_belt_enum" RENAME TO "users_belt_enum_old"`,
    );

    // Step 5: Create new enum with lowercase values
    await queryRunner.query(
      `CREATE TYPE "public"."users_belt_enum" AS ENUM('white', 'yellow', 'orange', 'green', 'blue', 'brown', 'black')`,
    );

    // Step 6: Convert column back to enum
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "belt" TYPE "public"."users_belt_enum" USING "belt"::"public"."users_belt_enum"`,
    );

    // Step 7: Restore default
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "belt" SET DEFAULT 'white'`,
    );

    // Step 8: Drop old enum
    await queryRunner.query(`DROP TYPE "public"."users_belt_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop default temporarily
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "belt" DROP DEFAULT`,
    );

    // Step 2: Convert column to text
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "belt" TYPE text USING "belt"::text`,
    );

    // Step 3: Update existing data back to PascalCase
    await queryRunner.query(`UPDATE "users" SET "belt" = INITCAP("belt")`);

    // Step 4: Create old enum type
    await queryRunner.query(
      `CREATE TYPE "public"."users_belt_enum_old" AS ENUM('White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black')`,
    );

    // Step 5: Convert column to old enum
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "belt" TYPE "public"."users_belt_enum_old" USING "belt"::"public"."users_belt_enum_old"`,
    );

    // Step 6: Restore old default
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "belt" SET DEFAULT 'White'`,
    );

    // Step 7: Drop new enum and rename
    await queryRunner.query(`DROP TYPE "public"."users_belt_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."users_belt_enum_old" RENAME TO "users_belt_enum"`,
    );
  }
}
