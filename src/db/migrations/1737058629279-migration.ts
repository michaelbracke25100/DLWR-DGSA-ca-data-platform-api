import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1737058629279 implements MigrationInterface {
  name = 'Migration1737058629279';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "pipeline_runs_logs" ("id" uniqueidentifier NOT NULL, "run_id" uniqueidentifier NOT NULL, "log_timestamp" datetime2 NOT NULL, "log_message" nvarchar(255) NULL, CONSTRAINT "PK_c8a8117b875e8812a5a404504e1" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IX_run_id" ON "pipeline_runs_logs" ("run_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IX_run_id" ON "pipeline_runs_logs"`);
    await queryRunner.query(`DROP TABLE "pipeline_runs_logs"`);
  }
}
