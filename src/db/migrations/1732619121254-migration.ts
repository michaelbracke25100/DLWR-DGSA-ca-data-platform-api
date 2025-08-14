import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1732619121254 implements MigrationInterface {
  name = 'Migration1732619121254';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "pipelines" ("id" bigint NOT NULL IDENTITY(1,1), "name" nvarchar(255) NOT NULL, "parameters" nvarchar(MAX) NOT NULL, "job_id" uniqueidentifier NOT NULL, "pipeline_id" uniqueidentifier NOT NULL, "state" nvarchar(100) NOT NULL, "cron" nvarchar(100), "deleted_date" datetime2(3), CONSTRAINT "PK_e38ea171cdfad107c1f3db2c036" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "pipeline_runs" ("run_id" uniqueidentifier NOT NULL, "job_id" uniqueidentifier NOT NULL, "pipeline_id" uniqueidentifier NOT NULL, "run_parameters_compressed" nvarchar(MAX), "run_parameters_hash" nvarchar(MAX), "state" nvarchar(100) CONSTRAINT CHK_42e029cc9f179be8d03b01c8cd_ENUM CHECK(state IN ('REQUESTED','QUEUED','ESTIMATING','IN_PROGRESS','SUCCESSFUL','FAILED')) NOT NULL, "queued_time" datetime2(3), "start_time" datetime2(3), "estimated_duration" bigint, "end_time" datetime2(3), CONSTRAINT "PK_6cc2f411f3d10eda2ae797f3f56" PRIMARY KEY ("run_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "pipeline_runs_outputs" ("id" uniqueidentifier NOT NULL, "run_id" uniqueidentifier NOT NULL, "type" nvarchar(100) CONSTRAINT CHK_cf72249b0649b369e0fb1e94c4_ENUM CHECK(type IN ('JSON','CSV','XML','BINARY','ERROR')) NOT NULL, "size" nvarchar(255), "location" nvarchar(255) NOT NULL, CONSTRAINT "PK_8d013173afb19c8bcbec50a29cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IX_run_id" ON "pipeline_runs_outputs" ("run_id") `);
    await queryRunner.query(`CREATE TABLE "secrets" ("id" bigint NOT NULL IDENTITY(1,1), "name" nvarchar(255) NOT NULL, "state" nvarchar(100) NOT NULL, "created_date" datetime2(3) NOT NULL, "modified_date" datetime2(3), CONSTRAINT "PK_d4ff48ddba1883d4dc142b9c697" PRIMARY KEY ("id"))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "secrets"`);
    await queryRunner.query(`DROP INDEX "IX_run_id" ON "pipeline_runs_outputs"`);
    await queryRunner.query(`DROP TABLE "pipeline_runs_outputs"`);
    await queryRunner.query(`DROP TABLE "pipeline_runs"`);
    await queryRunner.query(`DROP TABLE "pipelines"`);
  }
}
