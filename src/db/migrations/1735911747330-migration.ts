import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1735911747330 implements MigrationInterface {
  name = 'Migration1735911747330';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipeline_runs" ADD "created_by" nvarchar(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipeline_runs" DROP COLUMN "created_by"`);
  }
}
