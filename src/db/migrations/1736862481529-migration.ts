import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1736862481529 implements MigrationInterface {
  name = 'Migration1736862481529';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "name" nvarchar(255)`);
    await queryRunner.query(`UPDATE data_objects SET name = path;`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "type" nvarchar(255)`);
    await queryRunner.query(`UPDATE data_objects SET type = file_type;`);
    await queryRunner.query(`UPDATE data_objects SET type = 'OTHER' WHERE type = 'CSV';`);
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "path" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "state" nvarchar(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "state" nvarchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "path" nvarchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "name"`);
  }
}
