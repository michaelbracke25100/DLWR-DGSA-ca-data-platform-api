import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1734352188757 implements MigrationInterface {
  name = 'Migration1734352188757';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "linkedservices" ("id" bigint NOT NULL IDENTITY(1,1), "linkedservice_id" uniqueidentifier NOT NULL, "name" nvarchar(255) NOT NULL, "state" nvarchar(100) NOT NULL, "type" nvarchar(255) NOT NULL, "config" nvarchar(MAX) NOT NULL, "created_date" datetime2(3) NOT NULL, "modified_date" datetime2(3), CONSTRAINT "PK_bbf244a495666d8d9df2d564258" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "pipelines" ADD "linkedservice_id" uniqueidentifier`);
    await queryRunner.query(`UPDATE "pipelines" SET "linkedservice_id" = '70140976-9BA4-4375-9ACA-001C1928452A' WHERE "linkedservice_id" IS NULL;`);
    await queryRunner.query(`ALTER TABLE "pipelines" ALTER COLUMN "linkedservice_id" uniqueidentifier NOT NULL;`);
    await queryRunner.query(`ALTER TABLE "pipelines" ADD "privacy_level" nvarchar(100)`);
    await queryRunner.query(`UPDATE "pipelines" SET "privacy_level" = 'public' WHERE "privacy_level" IS NULL;`);
    await queryRunner.query(`ALTER TABLE "pipelines" ALTER COLUMN "privacy_level" nvarchar(100) NOT NULL;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipelines" DROP COLUMN "privacy_level"`);
    await queryRunner.query(`ALTER TABLE "pipelines" DROP COLUMN "linkedservice_id"`);
    await queryRunner.query(`DROP TABLE "linkedservices"`);
  }
}
