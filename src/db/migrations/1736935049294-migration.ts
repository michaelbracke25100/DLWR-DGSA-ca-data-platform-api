import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1736935049294 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE linkedservices SET state = 'CONNECTED' WHERE state = 'SUCCESSFUL';`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE linkedservices SET state = 'SUCCESSFUL' WHERE state = 'CONNECTED';`);
  }
}
