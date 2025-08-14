import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1736341862126 implements MigrationInterface {
  name = 'Migration1736341862126';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "deleted_date" datetime2(3)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "deleted_date"`);
  }
}
