import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1742578646710 implements MigrationInterface {
  name = 'Migration1742578646710';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "path"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "path" nvarchar(255)`);
  }
}
