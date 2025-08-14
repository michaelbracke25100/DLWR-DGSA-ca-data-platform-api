import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1736427332870 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE linkedservices SET state = 'SUCCESSFUL' WHERE state = 'ACTIVE';`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE linkedservices SET state = 'ACTIVE';`);
  }
}
