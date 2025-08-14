import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1736862883072 implements MigrationInterface {
  name = 'Migration1736862883072';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "file_type"`);
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "name" nvarchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "type" nvarchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "state" nvarchar(255) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "state" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "type" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "name" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "file_type" nvarchar(255) NOT NULL`);
  }
}
