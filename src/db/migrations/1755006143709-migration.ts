import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1755006143709 implements MigrationInterface {
  name = 'Migration1755006143709';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "dataobject_runs" ("run_id" uniqueidentifier NOT NULL, "job_id" uniqueidentifier NOT NULL, "dataobject_id" uniqueidentifier NOT NULL, "run_parameters_compressed" nvarchar(MAX) NOT NULL, "run_parameters_hash" nvarchar(MAX) NOT NULL, "state" nvarchar(100) CONSTRAINT CHK_7c8c0cfe22a1f33a949b8f19f7_ENUM CHECK(state IN ('REQUESTED','QUEUED','ESTIMATING','IN_PROGRESS','SUCCESSFUL','FAILED')) NOT NULL, "queued_time" datetime2(3) NOT NULL, "start_time" datetime2(3), "estimated_duration" bigint, "end_time" datetime2(3), "modified_by" nvarchar(255), CONSTRAINT "PK_dataobject_runs" PRIMARY KEY ("run_id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "dataobject_runs"');
  }
}
