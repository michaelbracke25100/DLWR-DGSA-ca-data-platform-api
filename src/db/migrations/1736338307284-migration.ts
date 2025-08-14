import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1736338307284 implements MigrationInterface {
  name = 'Migration1736338307284';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "origin_name"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "destination_name"`);
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "path" nvarchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "file_type" nvarchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "state" nvarchar(255) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "state" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "file_type" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "path" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "destination_name" nvarchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "origin_name" nvarchar(255) NOT NULL`);
  }
}
