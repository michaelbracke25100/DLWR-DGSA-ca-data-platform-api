import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1741786920356 implements MigrationInterface {
  name = 'Migration1741786920356';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "managed_by_pipeline" bit NOT NULL CONSTRAINT "DF_7d3c93aae853c1b3d58eaa6086b" DEFAULT 0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" DROP CONSTRAINT "DF_7d3c93aae853c1b3d58eaa6086b"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "managed_by_pipeline"`);
  }
}
