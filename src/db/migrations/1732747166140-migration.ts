import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1732747166140 implements MigrationInterface {
  name = 'Migration1732747166140';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "data_objects" ("id" bigint NOT NULL IDENTITY(1,1), "pipeline_id" uniqueidentifier NOT NULL, "origin_name" nvarchar(255) NOT NULL, "destination_name" nvarchar(255) NOT NULL, CONSTRAINT "PK_52876ff3525a922214e9ebea2c2" PRIMARY KEY ("id"))`);
    await queryRunner.query(`ALTER TABLE "pipelines" ALTER COLUMN "cron" nvarchar(100) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs" ALTER COLUMN "run_parameters_compressed" nvarchar(MAX) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs" ALTER COLUMN "run_parameters_hash" nvarchar(MAX) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs" ALTER COLUMN "queued_time" datetime2(3) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipeline_runs" ALTER COLUMN "queued_time" datetime2(3)`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs" ALTER COLUMN "run_parameters_hash" nvarchar(MAX)`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs" ALTER COLUMN "run_parameters_compressed" nvarchar(MAX)`);
    await queryRunner.query(`ALTER TABLE "pipelines" ALTER COLUMN "cron" nvarchar(100)`);
    await queryRunner.query(`DROP TABLE "data_objects"`);
  }
}
