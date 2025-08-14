import { And, DataSource, IsNull, Like, Not, Or, type Repository } from 'typeorm';
import { Pipeline } from '../db/pipeline.entity';
import { v4 as uuidv4 } from 'uuid';
import { PipelinePrivacyLevel, PipelineState, PipelineType } from '../schemas/pipeline.entity';

class PipelineEntityService {
  private readonly repository: Repository<Pipeline>;

  constructor(datasource: DataSource) {
    this.repository = datasource.getRepository(Pipeline);
  }

  async createPipeline(
    job_id: string,
    name: string,
    description: string | null,
    modified_by: object | null,
    owner: object | null,
    privacy_level: PipelinePrivacyLevel,
    cron: string | null,
    type: PipelineType,
    linkedservice_id: string,
    parameters: object,
    user_groups: string[] | null,
  ): Promise<Pipeline> {
    const object: Pipeline = new Pipeline();
    object.description = description;
    object.job_id = job_id;
    object.pipeline_id = uuidv4().toUpperCase();
    object.name = name;
    object.cron = cron;
    object.state = PipelineState.ENABLED;
    object.type = type;
    object.privacy_level = privacy_level;
    object.user_groups = user_groups;
    object.parameters = JSON.stringify(parameters);
    object.linkedservice_id = linkedservice_id;
    object.modified_by = JSON.stringify(modified_by);
    object.owner = JSON.stringify(owner);
    object.created_date = new Date();
    return await this.repository.save(object);
  }

  async updatePipeline(pipeline_id: string, job_id: string, state: PipelineState, name: string, description: string | null, modified_by: object | null, cron: string | null, linkedservice_id: string, parameters: object, user_groups: string[] | null): Promise<Pipeline | undefined> {
    const object = await this.getPipelineById(pipeline_id);
    if (!object) return undefined;
    object.description = description;
    object.job_id = job_id;
    object.name = name;
    object.cron = cron;
    object.state = state;
    object.user_groups = user_groups;
    object.parameters = JSON.stringify(parameters);
    object.linkedservice_id = linkedservice_id;
    object.modified_by = JSON.stringify(modified_by);
    object.modified_date = new Date();
    if (state != PipelineState.DELETED) object.deleted_date = null;
    const pipeline = await this.repository.save(object);
    return pipeline;
  }

  async deletePipeline(pipeline_id: string): Promise<Pipeline | undefined> {
    const object = await this.getPipelineById(pipeline_id);
    if (!object) return undefined;
    object.deleted_date = new Date();
    object.state = PipelineState.DELETED;
    object.parameters = JSON.stringify(object.parameters);
    return await this.repository.save(object);
  }

  async getPipelines(
    take: number | undefined = undefined,
    pipeline_id: string | undefined = undefined,
    job_id: string | undefined = undefined,
    linkedservice_id: string | undefined = undefined,
    name: string | undefined = undefined,
    state: PipelineState | undefined = undefined,
    privacy_level: PipelinePrivacyLevel | undefined = undefined,
  ): Promise<Pipeline[]> {
    return await this.repository.find({
      where: {
        pipeline_id,
        job_id,
        linkedservice_id,
        name,
        state,
        privacy_level,
      },
      take,
    });
  }

  async getActivePipelines(): Promise<Pipeline[]> {
    return await this.repository.findBy({ state: PipelineState.ENABLED, cron: Not(IsNull()) });
  }

  async getPipelineById(pipeline_id: string): Promise<Pipeline | null> {
    return await this.repository.findOneBy({ pipeline_id: pipeline_id });
  }

  async getPipelineByJobId(job_id: string): Promise<Pipeline[]> {
    return await this.repository.findBy({ job_id: job_id });
  }

  async getPipelineByName(name: string): Promise<Pipeline | null> {
    return await this.repository.findOneBy({ name: name });
  }

  async getPipelineBySchemaAndTableName(schema: string, table: string, state: PipelineState | undefined, pipeline_id: string | undefined = undefined): Promise<Pipeline | null> {
    if (pipeline_id) {
      if (state)
        return await this.repository.findOne({
          where: {
            parameters: Or(
              And(
                Like(`%"origin_schema_name":"${schema}"%`),
                Like(`%"origin_object_name":"${table}"%`)
              ),
              And(
                Like(`%"destination_schema_name":"${schema}"%`),
                Like(`%"destination_object_name":"${table}"%`)
              )
            ),
            type: PipelineType.DATABASE_SYNCHRONIZATION,
            pipeline_id: Not(pipeline_id),
            state,
          },
        });
      else
        return await this.repository.findOne({
          where: {
            parameters: Or(
              And(
                Like(`%"origin_schema_name":"${schema}"%`),
                Like(`%"origin_object_name":"${table}"%`)
              ),
              And(
                Like(`%"destination_schema_name":"${schema}"%`),
                Like(`%"destination_object_name":"${table}"%`)
              )
            ),
            type: PipelineType.DATABASE_SYNCHRONIZATION,
            pipeline_id: Not(pipeline_id),
          },
        });
    } else {
      // * if no pipeline_id is provided, we will check for all pipelines
      if (state) {
        return await this.repository.findOne({
          where: {
            parameters: Or(
              And(
                Like(`%"origin_schema_name":"${schema}"%`),
                Like(`%"origin_object_name":"${table}"%`)
              ),
              And(
                Like(`%"destination_schema_name":"${schema}"%`),
                Like(`%"destination_object_name":"${table}"%`)
              )
            ),
            type: PipelineType.DATABASE_SYNCHRONIZATION,
            state,
          },
        });
      }
      else {
        return await this.repository.findOne({
          where: {
            parameters: Or(
              And(
                Like(`%"origin_schema_name":"${schema}"%`),
                Like(`%"origin_object_name":"${table}"%`)
              ),
              And(
                Like(`%"destination_schema_name":"${schema}"%`),
                Like(`%"destination_object_name":"${table}"%`)
              )
            ),
            type: PipelineType.DATABASE_SYNCHRONIZATION,
          },
        });
      }
    }
  }
}

export default PipelineEntityService;
