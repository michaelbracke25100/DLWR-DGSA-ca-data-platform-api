import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1736176263046 implements MigrationInterface {
  name = 'Migration1736176263046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipelines" ADD "modified_date" datetime2(3)`);
    await queryRunner.query(`ALTER TABLE "pipelines" ADD "created_date" datetime2(3)`);
    await queryRunner.query(`UPDATE "pipelines" SET "privacy_level" = 'PUBLIC' WHERE "privacy_level" = 'public'`);
    await queryRunner.query(`UPDATE "pipelines" SET "privacy_level" = 'PRIVATE' WHERE "privacy_level" = 'private'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipelines" DROP COLUMN "created_date"`);
    await queryRunner.query(`ALTER TABLE "pipelines" DROP COLUMN "modified_date"`);
    await queryRunner.query(`UPDATE "pipelines" SET "privacy_level" = 'public' WHERE "privacy_level" = 'PUBLIC'`);
    await queryRunner.query(`UPDATE "pipelines" SET "privacy_level" = 'private' WHERE "privacy_level" = 'PRIVATE'`);
  }
}
