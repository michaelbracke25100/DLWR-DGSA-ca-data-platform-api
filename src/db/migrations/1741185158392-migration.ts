import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1741185158392 implements MigrationInterface {
  name = 'Migration1741185158392';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipelines" ALTER COLUMN "linkedservice_id" uniqueidentifier`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pipelines" ALTER COLUMN "linkedservice_id" uniqueidentifier NOT NULL`);
  }
}
