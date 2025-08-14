import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1736174954614 implements MigrationInterface {
  name = 'Migration1736174954614';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "metadata" DROP COLUMN "source_name"`);
    await queryRunner.query(`ALTER TABLE "metadata" ADD "business_data_owner" nvarchar(MAX)`);
    await queryRunner.query(`ALTER TABLE "metadata" ADD "business_data_steward" nvarchar(MAX)`);
    await queryRunner.query(`ALTER TABLE "metadata" ADD "technical_data_steward" nvarchar(MAX)`);
    await queryRunner.query(`ALTER TABLE "metadata" ADD "domain" nvarchar(MAX)`);
    await queryRunner.query(`ALTER TABLE "metadata" ADD "sub_domain" nvarchar(MAX)`);
    await queryRunner.query(`ALTER TABLE "metadata" ALTER COLUMN "business_unit" nvarchar(MAX)`);
    await queryRunner.query(`ALTER TABLE "metadata" ALTER COLUMN "it_solution" nvarchar(MAX)`);
    await queryRunner.query(`ALTER TABLE "metadata" ALTER COLUMN "eurovoc_subjects" nvarchar(MAX)`);
    await queryRunner.query(`UPDATE "pipelines" SET "type" = 'DATABASE_SYNCHRONIZATION'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "metadata" ALTER COLUMN "eurovoc_subjects" nvarchar(MAX) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "metadata" ALTER COLUMN "it_solution" nvarchar(MAX) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "metadata" ALTER COLUMN "business_unit" nvarchar(MAX) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "metadata" DROP COLUMN "sub_domain"`);
    await queryRunner.query(`ALTER TABLE "metadata" DROP COLUMN "domain"`);
    await queryRunner.query(`ALTER TABLE "metadata" DROP COLUMN "technical_data_steward"`);
    await queryRunner.query(`ALTER TABLE "metadata" DROP COLUMN "business_data_steward"`);
    await queryRunner.query(`ALTER TABLE "metadata" DROP COLUMN "business_data_owner"`);
    await queryRunner.query(`ALTER TABLE "metadata" ADD "source_name" nvarchar(MAX) NOT NULL`);
    await queryRunner.query(`UPDATE "pipelines" SET "type" = 'SCHEDULE'`);
  }
}
