import {EntityManager, QueryRunner} from 'typeorm';

export interface ISqlValidationController {
  validateSql(sql: string): Promise<{valid: boolean; error?: string}>;
}

interface ResultItem {
  name: string;
}

export class SqlValidationController implements ISqlValidationController {
  private manager: EntityManager;

  constructor(manager: EntityManager) {
    this.manager = manager;
  }

  async validateSql(sql: string): Promise<{valid: boolean; errormessage?: object; error?: string}> {
    const queryRunner: QueryRunner = this.manager.connection.createQueryRunner();

    try {
      const result = await queryRunner.query('EXEC sp_describe_first_result_set @tsql = @0', [sql]);

      if (!result || result.length === 0) {
        return {valid: false, errormessage: {error: "Query wouldn't produce any results"}};
      }

      const names = result.map((item: ResultItem) => item.name);
      const uniqueNames = new Set(names);
      if (uniqueNames.size !== names.length) {
        return {valid: false, errormessage: {error: 'Ambiguous column name detected'}};
      }

      return {valid: true};
    } catch (error: unknown) {
      console.error(`Error while checking pipelines to run: ${JSON.stringify(error)}`);
      return {valid: false, errormessage: Object(error)};
    } finally {
      await queryRunner.release();
    }
  }
}
