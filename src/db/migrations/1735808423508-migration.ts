import {MigrationInterface, QueryRunner} from 'typeorm';

export class Migration1735808423508 implements MigrationInterface {
  name = 'Migration1735808423508';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`EXEC sp_rename "dbo.pipelines.id", "created_by"`);
    await queryRunner.query(`EXEC sp_rename "dbo.pipelines.PK_e38ea171cdfad107c1f3db2c036", "PK_2b26dce076a09bf2b3c127744c8"`);
    await queryRunner.query(`EXEC sp_rename "dbo.pipeline_runs_outputs.id", "output_id"`);
    await queryRunner.query(`EXEC sp_rename "dbo.pipeline_runs_outputs.PK_8d013173afb19c8bcbec50a29cb", "PK_a7699f9559d4d4c6f7f04610f72"`);
    await queryRunner.query(`EXEC sp_rename "dbo.data_objects.id", "dataobject_id"`);
    await queryRunner.query(`EXEC sp_rename "dbo.data_objects.PK_52876ff3525a922214e9ebea2c2", "PK_07e99c3383b5281c6262afe06aa"`);
    await queryRunner.query(
      `CREATE TABLE "metadata" ("metadata_id" uniqueidentifier NOT NULL, "pipeline_id" uniqueidentifier NOT NULL, "dataobject_id" uniqueidentifier, "business_unit" nvarchar(MAX) NOT NULL, "it_solution" nvarchar(MAX) NOT NULL, "source_name" nvarchar(MAX) NOT NULL, "eurovoc_subjects" nvarchar(MAX) NOT NULL, CONSTRAINT "PK_c7cf46d8662bd3251cb2f2bc855" PRIMARY KEY ("metadata_id"))`,
    );
    await queryRunner.query(`ALTER TABLE "linkedservices" DROP CONSTRAINT "PK_bbf244a495666d8d9df2d564258"`);
    await queryRunner.query(`ALTER TABLE "linkedservices" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs_outputs" DROP CONSTRAINT "PK_a7699f9559d4d4c6f7f04610f72"`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs_outputs" ADD CONSTRAINT "PK_2c11e1a34ae61fce8c834867956" PRIMARY KEY ("output_id", "run_id")`);
    await queryRunner.query(`ALTER TABLE "pipelines" DROP CONSTRAINT "PK_2b26dce076a09bf2b3c127744c8"`);
    await queryRunner.query(`ALTER TABLE "pipelines" ADD CONSTRAINT "PK_1781768f3bd452c89eccc078834" PRIMARY KEY ("created_by", "pipeline_id")`);
    await queryRunner.query(`ALTER TABLE "pipelines" DROP CONSTRAINT "PK_1781768f3bd452c89eccc078834"`);
    await queryRunner.query(`ALTER TABLE "pipelines" ADD CONSTRAINT "PK_a860e6f50491dd9b88d575409fe" PRIMARY KEY ("pipeline_id")`);
    await queryRunner.query(`ALTER TABLE "pipelines" DROP COLUMN "created_by"`);
    await queryRunner.query(`ALTER TABLE "pipelines" ADD "created_by" nvarchar(255)`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP CONSTRAINT "PK_07e99c3383b5281c6262afe06aa"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "dataobject_id"`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "dataobject_id" uniqueidentifier`);
    await queryRunner.query(`UPDATE "data_objects" SET "dataobject_id" = UPPER(NEWID()) WHERE "dataobject_id" IS NULL`);
    await queryRunner.query(`ALTER TABLE "data_objects" ALTER COLUMN "dataobject_id" uniqueidentifier NOT NULL`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD CONSTRAINT "PK_07e99c3383b5281c6262afe06aa" PRIMARY KEY ("dataobject_id")`);
    await queryRunner.query(`ALTER TABLE "linkedservices" ADD CONSTRAINT "PK_f934eab46248fdd8f2f79d60e42" PRIMARY KEY ("linkedservice_id")`);
    // Insert temporary data into the metadata table
    await queryRunner.query(`
                    INSERT INTO "metadata" ("metadata_id", "pipeline_id", "dataobject_id", "business_unit", "it_solution", "source_name", "eurovoc_subjects")
                    SELECT UPPER(NEWID()), "pipeline_id", NULL, 'Business Unit', 'IT Solution', 'Source Name', 'Eurovoc Subjects'
                    FROM "pipelines"
                `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "linkedservices" DROP CONSTRAINT "PK_f934eab46248fdd8f2f79d60e42"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP CONSTRAINT "PK_07e99c3383b5281c6262afe06aa"`);
    await queryRunner.query(`ALTER TABLE "data_objects" DROP COLUMN "dataobject_id"`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD "dataobject_id" bigint NOT NULL IDENTITY(1,1)`);
    await queryRunner.query(`ALTER TABLE "data_objects" ADD CONSTRAINT "PK_07e99c3383b5281c6262afe06aa" PRIMARY KEY ("dataobject_id")`);
    await queryRunner.query(`ALTER TABLE "pipelines" DROP COLUMN "created_by"`);
    await queryRunner.query(`ALTER TABLE "pipelines" ADD "created_by" bigint NOT NULL IDENTITY(1,1)`);
    await queryRunner.query(`ALTER TABLE "pipelines" DROP CONSTRAINT "PK_a860e6f50491dd9b88d575409fe"`);
    await queryRunner.query(`ALTER TABLE "pipelines" ADD CONSTRAINT "PK_1781768f3bd452c89eccc078834" PRIMARY KEY ("created_by", "pipeline_id")`);
    await queryRunner.query(`ALTER TABLE "pipelines" DROP CONSTRAINT "PK_1781768f3bd452c89eccc078834"`);
    await queryRunner.query(`ALTER TABLE "pipelines" ADD CONSTRAINT "PK_2b26dce076a09bf2b3c127744c8" PRIMARY KEY ("created_by")`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs_outputs" DROP CONSTRAINT "PK_2c11e1a34ae61fce8c834867956"`);
    await queryRunner.query(`ALTER TABLE "pipeline_runs_outputs" ADD CONSTRAINT "PK_a7699f9559d4d4c6f7f04610f72" PRIMARY KEY ("output_id")`);
    await queryRunner.query(`ALTER TABLE "linkedservices" ADD "id" bigint NOT NULL IDENTITY(1,1)`);
    await queryRunner.query(`ALTER TABLE "linkedservices" ADD CONSTRAINT "PK_bbf244a495666d8d9df2d564258" PRIMARY KEY ("id")`);
    await queryRunner.query(`DROP TABLE "metadata"`);
    await queryRunner.query(`EXEC sp_rename "dbo.data_objects.PK_07e99c3383b5281c6262afe06aa", "PK_52876ff3525a922214e9ebea2c2"`);
    await queryRunner.query(`EXEC sp_rename "dbo.data_objects.dataobject_id", "id"`);
    await queryRunner.query(`EXEC sp_rename "dbo.pipeline_runs_outputs.PK_a7699f9559d4d4c6f7f04610f72", "PK_8d013173afb19c8bcbec50a29cb"`);
    await queryRunner.query(`EXEC sp_rename "dbo.pipeline_runs_outputs.output_id", "id"`);
    await queryRunner.query(`EXEC sp_rename "dbo.pipelines.PK_2b26dce076a09bf2b3c127744c8", "PK_e38ea171cdfad107c1f3db2c036"`);
    await queryRunner.query(`EXEC sp_rename "dbo.pipelines.created_by", "id"`);
  }
}
