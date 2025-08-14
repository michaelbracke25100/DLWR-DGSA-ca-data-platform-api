import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1736246962120 implements MigrationInterface {
  name = 'Migration1736246962120';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipelines" ALTER COLUMN "type" nvarchar(100) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipelines" ALTER COLUMN "type" nvarchar(100)`);
  }
}
