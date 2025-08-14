import {DataSource, In, Not, type Repository} from 'typeorm';
import {PipelineRun} from '../db/pipeline_run.entity';
import {JSONcompress, JSONToHash} from '../utilities/utils';
import {PipelineRunState} from '../schemas/pipeline_run.entity';

class PipelineRunEntityService {
  private readonly repository: Repository<PipelineRun>;

  constructor(datasource: DataSource) {
    this.repository = datasource.getRepository(PipelineRun);
  }

  async createPipelineRun(job_id: string, run_id: string, pipeline_id: string, modified_by: object, job_parameters: object): Promise<PipelineRun | undefined> {
    const object: PipelineRun = new PipelineRun();

    object.job_id = job_id;
    object.run_id = run_id;
    object.pipeline_id = pipeline_id;
    object.run_parameters_compressed = JSONcompress(job_parameters);
    object.run_parameters_hash = JSONToHash(job_parameters);
    object.queued_time = new Date();
    object.state = PipelineRunState.REQUESTED;
    object.modified_by = JSON.stringify(modified_by);
    return await this.repository.save(object);
  }

  async updatePipelineRun(run_id: string, state: PipelineRunState, start_time: Date | null, end_time: Date | null, estimated_duration: number | null): Promise<PipelineRun | undefined> {
    const object = await this.getPipelineRunById(run_id);
    if (!object) return undefined;
    object.state = state;
    object.start_time = start_time;
    object.end_time = end_time;
    object.estimated_duration = estimated_duration;
    return await this.repository.save(object);
  }

  async updatePipelineRunState(run_id: string, state: PipelineRunState): Promise<PipelineRun | undefined> {
    const object = await this.getPipelineRunById(run_id);
    if (!object) return undefined;
    object.state = state;
    return await this.repository.save(object);
  }

  async updatePipelineRunStateQueued(run_id: string, state: PipelineRunState, queued_time: Date): Promise<PipelineRun | undefined> {
    const object = await this.getPipelineRunById(run_id);
    if (!object) return undefined;
    object.state = state;
    object.queued_time = queued_time;
    return await this.repository.save(object);
  }

  async updatePipelineRunStateEstimating(run_id: string, state: PipelineRunState): Promise<PipelineRun | undefined> {
    const object = await this.getPipelineRunById(run_id);
    if (!object) return undefined;
    object.state = state;
    return await this.repository.save(object);
  }

  async updatePipelineRunStateStarted(run_id: string, state: PipelineRunState, start_time: Date | null, estimated_duration: number | null): Promise<PipelineRun | undefined> {
    const object = await this.getPipelineRunById(run_id);
    if (!object) return undefined;
    object.state = state;
    object.start_time = start_time;
    object.estimated_duration = estimated_duration;
    return await this.repository.save(object);
  }

  async updatePipelineRunStateCompleted(run_id: string, state: PipelineRunState, end_time: Date | null): Promise<PipelineRun | undefined> {
    const object = await this.getPipelineRunById(run_id);
    if (!object) return undefined;
    object.state = state;
    object.end_time = end_time;
    return await this.repository.save(object);
  }

  async getPipelineRunsByJobId(job_id: string): Promise<PipelineRun[]> {
    return await this.repository.findBy({job_id: job_id});
  }

  async getOngoingPipelineRuns(): Promise<PipelineRun[]> {
    const result = await this.repository.findBy({state: In([PipelineRunState.QUEUED, PipelineRunState.ESTIMATING, PipelineRunState.IN_PROGRESS, PipelineRunState.REQUESTED])});
    return result;
  }

  async getPipelineRunById(run_id: string): Promise<PipelineRun | null> {
    return await this.repository.findOneBy({run_id: run_id});
  }

  async getPiplineRunByParametersHashAndNotFailed(job_id: string, parameters_hash: string): Promise<PipelineRun | null> {
    return await this.repository.findOneBy({job_id: job_id, run_parameters_hash: parameters_hash, state: Not(PipelineRunState.FAILED)});
  }

  async getLatestPipelineRunByPipelineId(pipeline_id: string): Promise<PipelineRun | null> {
    return await this.repository.findOne({where: {pipeline_id: pipeline_id}, order: {queued_time: 'DESC'}});
  }

  async getPipelineRunByPipelineId(pipeline_id: string, take: number | undefined = undefined, state: PipelineRunState | undefined = undefined): Promise<PipelineRun[]> {
    return await this.repository.find({where: {pipeline_id, state}, take, order: {queued_time: 'DESC'}});
  }
}

export default PipelineRunEntityService;
