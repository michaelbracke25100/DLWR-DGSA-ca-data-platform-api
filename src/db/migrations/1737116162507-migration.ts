import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1737116162507 implements MigrationInterface {
  name = 'Migration1737116162507';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`EXEC sp_rename "dbo.pipelines.created_by", "modified_by"`);
    await queryRunner.query(`EXEC sp_rename "dbo.pipeline_runs.created_by", "modified_by"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "uploaded_by"`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "description" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "modified_by" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "pipelines" DROP COLUMN "modified_by"`);
    await queryRunner.query(`ALTER TABLE "pipelines" ADD "modified_by" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs" DROP COLUMN "modified_by"`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs" ADD "modified_by" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "metadata" ALTER COLUMN "pipeline_id" uniqueidentifier`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "metadata" ALTER COLUMN "pipeline_id" uniqueidentifier NOT NULL`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs" DROP COLUMN "modified_by"`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs" ADD "modified_by" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "pipelines" DROP COLUMN "modified_by"`);
    await queryRunner.query(`ALTER TABLE "pipelines" ADD "modified_by" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "modified_by"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "uploaded_by" nvarchar(255)`);
    await queryRunner.query(`EXEC sp_rename "dbo.pipeline_runs.modified_by", "created_by"`);
    await queryRunner.query(`EXEC sp_rename "dbo.pipelines.modified_by", "created_by"`);
  }
}
