import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1755006143708 implements MigrationInterface {
    name = 'Migration1755006143708'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_objects" ADD "is_enabled_for_download_apis" bit CONSTRAINT "DF_ee28668209bddcd892200196e32" DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_objects" DROP CONSTRAINT "DF_ee28668209bddcd892200196e32"`);
        await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "is_enabled_for_download_apis"`);
    }

}
