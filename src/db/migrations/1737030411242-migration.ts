import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1737030411242 implements MigrationInterface {
  name = 'Migration1737030411242';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "linkedservices" DROP COLUMN "name"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "linkedservices" ADD "name" nvarchar(255) NOT NULL`);
  }
}
