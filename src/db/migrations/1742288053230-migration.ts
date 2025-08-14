import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1742288053230 implements MigrationInterface {
  name = 'Migration1742288053230';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" DROP CONSTRAINT "DF_7d3c93aae853c1b3d58eaa6086b"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "managed_by_pipeline"`);
    await queryRunner.query(`ALTER TABLE "pipelines" ADD "user_groups" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "managed_by" nvarchar(255) NOT NULL CONSTRAINT "DF_dfaebb646758577bc94faee508d" DEFAULT 'DATAOBJECT'`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "user_groups" nvarchar(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "user_groups"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP CONSTRAINT "DF_dfaebb646758577bc94faee508d"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "managed_by"`);
    await queryRunner.query(`ALTER TABLE "pipelines" DROP COLUMN "user_groups"`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "managed_by_pipeline" bit NOT NULL`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD CONSTRAINT "DF_7d3c93aae853c1b3d58eaa6086b" DEFAULT 0 FOR "managed_by_pipeline"`);
  }
}
