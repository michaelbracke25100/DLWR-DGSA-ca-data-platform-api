import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1736337992174 implements MigrationInterface {
  name = 'Migration1736337992174';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "path" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "file_type" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "state" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "uploaded_by" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "uploaded_date" datetime2(3)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "modified_date" datetime2(3)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "pipeline_id" uniqueidentifier`);
    await queryRunner.query(`UPDATE data_objects SET path = CONCAT(origin_name, '.parquet');`);
    await queryRunner.query(`UPDATE data_objects SET file_type = 'PARQUET';`);
    await queryRunner.query(`UPDATE data_objects SET state = 'PUBLISHED';`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "pipeline_id" uniqueidentifier NOT NULL`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "modified_date"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "uploaded_date"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "uploaded_by"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "state"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "file_type"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "path"`);
  }
}
