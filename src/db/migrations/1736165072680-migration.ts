import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1736165072680 implements MigrationInterface {
  name = 'Migration1736165072680';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipelines" ADD "type" nvarchar(100)`);
    await queryRunner.query(`ALTER TABLE "pipelines" ALTER COLUMN "cron" nvarchar(100)`);
    await queryRunner.query(`UPDATE "pipelines" SET "type" = 'SCHEDULE'`);
    await queryRunner.query(`UPDATE "pipelines" SET "state" = 'ENABLED' WHERE "state" = 'ACTIVE'`);
    await queryRunner.query(`UPDATE "pipelines" SET "state" = 'DISABLED' WHERE "state" = 'DEACTIVATED'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipelines" ALTER COLUMN "cron" nvarchar(100) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "pipelines" DROP COLUMN "type"`);
  }
}
