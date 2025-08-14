import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1737127802541 implements MigrationInterface {
  name = 'Migration1737127802541';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "pipeline_runs_logs"`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs_logs" DROP COLUMN "log_message"`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs_logs" ADD "log_message" nvarchar(MAX) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipeline_runs_logs" DROP COLUMN "log_message"`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs_logs" ADD "log_message" nvarchar(255) NOT NULL`);
  }
}
