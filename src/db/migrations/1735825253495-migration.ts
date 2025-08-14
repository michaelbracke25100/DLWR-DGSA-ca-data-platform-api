import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1735825253495 implements MigrationInterface {
  name = 'Migration1735825253495';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipelines" ADD "description" nvarchar(MAX)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipelines" DROP COLUMN "description"`);
  }
}
