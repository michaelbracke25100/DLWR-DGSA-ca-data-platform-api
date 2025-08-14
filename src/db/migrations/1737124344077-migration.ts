import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1737124344077 implements MigrationInterface {
  name = 'Migration1737124344077';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipelines" ADD "owner" nvarchar(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipelines" DROP COLUMN "owner"`);
  }
}
