import { PipelineRun } from '../db/pipeline_run.entity';
import { JobParametersObjectsArrayOracle, JobParametersOracle } from '../schemas/job.parameters';
import { JobParametersObjectsArrayTransform, JobParametersTransform } from '../schemas/job.parameters';
import { ConfigOracleSql } from '../schemas/linkedservice.entity';
import { PipelineParametersOracle } from '../schemas/pipeline.parameters';
import { PipelineParametersTransform } from '../schemas/pipeline.parameters';
import { PipelineRunState } from '../schemas/pipeline_run.entity';
import JobOrchestratorService from '../services/JobOrchestratorService';
import LinkedServiceEntityService from '../services/LinkedServiceEntityService';
import PipelineEntityService from '../services/PipelineEntityService';
import PipelineRunEntityService from '../services/PipelineRunEntityService';
import PipelineRunLogEntityService from '../services/PipelineRunLogEntityService';
import { CustomError } from '../utilities/utils';

export interface IPipelineRunController {
  createPipelineRun(pipeline_id: string, modified_by: object): Promise<PipelineRun | undefined>;
  updatePipelineRun(run_id: string, state: PipelineRunState, start_time: Date | null, end_time: Date | null, estimated_duration: number | null): Promise<PipelineRun | undefined>;
  updatePipelineRunState(run_id: string, state: PipelineRunState): Promise<PipelineRun | undefined>;
  updatePipelineRunStateQueued(run_id: string, state: PipelineRunState, queued_time: Date): Promise<PipelineRun | undefined>;
  updatePipelineRunStateEstimating(run_id: string, state: PipelineRunState): Promise<PipelineRun | undefined>;
  updatePipelineRunStateStarted(run_id: string, state: PipelineRunState, start_time: Date | null, estimated_duration: number | null): Promise<PipelineRun | undefined>;
  updatePipelineRunStateCompleted(run_id: string, state: PipelineRunState, end_time: Date | null): Promise<PipelineRun | undefined>;
  getPipelineRunById(run_id: string): Promise<PipelineRun | null>;
  getPipelineRunByPipelineId(pipeline_id: string, take: number | undefined, state: PipelineRunState | undefined): Promise<PipelineRun[]>;
  getPipelineRunsByJobId(job_id: string): Promise<PipelineRun[]>;
  getOngoingPipelineRuns(): Promise<PipelineRun[]>;
  getPiplineRunByParametersHashAndNotFailed(job_id: string, parameters_hash: string): Promise<PipelineRun | null>;
  getLatestPipelineRunByPipelineId(pipeline_id: string): Promise<PipelineRun | null>;
}

export class PipelineRunController implements IPipelineRunController {
  private pipeline_entity_service: PipelineEntityService;
  private pipelinerun_entity_service: PipelineRunEntityService;
  private pipelinerunlog_entity_service: PipelineRunLogEntityService;
  private joborchestrator_service: JobOrchestratorService;
  private linkedservice_service: LinkedServiceEntityService;
  private synapse_pipeline_oracle_id: string;
  private synapse_pipeline_transform_id: string;

  constructor(
    pipeline_entity_service: PipelineEntityService,
    pipelinerun_entity_service: PipelineRunEntityService,
    pipelinerunlog_entity_service: PipelineRunLogEntityService,
    joborchestrator_service: JobOrchestratorService,
    linkedservice_service: LinkedServiceEntityService,
    synapse_pipeline_oracle_id: string,
    synapse_pipeline_transform_id: string,
  ) {
    this.pipeline_entity_service = pipeline_entity_service;
    this.pipelinerun_entity_service = pipelinerun_entity_service;
    this.pipelinerunlog_entity_service = pipelinerunlog_entity_service;
    this.joborchestrator_service = joborchestrator_service;
    this.linkedservice_service = linkedservice_service;
    this.synapse_pipeline_oracle_id = synapse_pipeline_oracle_id;
    this.synapse_pipeline_transform_id = synapse_pipeline_transform_id;
  }

  async createPipelineRun(pipeline_id: string, modified_by: object): Promise<PipelineRun | undefined> {
    const pipeline = await this.pipeline_entity_service.getPipelineById(pipeline_id);
    if (!pipeline) throw new CustomError('Pipeline not found');
    if (pipeline.job_id === this.synapse_pipeline_oracle_id) {
      const linkedservice = await this.linkedservice_service.getLinkedServiceById(pipeline.linkedservice_id);
      if (!linkedservice) throw new CustomError('Linked Service not found');
      const pipeline_parameters = pipeline.parameters as PipelineParametersOracle;
      const linkedservice_config = linkedservice.config as ConfigOracleSql;
      const objects: JobParametersObjectsArrayOracle = [];
      for (const object of pipeline_parameters.objects) {
        let query: string | undefined = undefined;
        if (object.columns) {
          query = `SELECT ${object.columns.map(name => `"${name}"`).join(', ')} FROM ${object.origin_schema_name}.${object.origin_object_name};`;
        } else {
          query = `SELECT * FROM ${object.origin_schema_name}.${object.origin_object_name};`;
        }
        objects.push({ type: object.type, origin_schema_name: object.origin_schema_name, origin_object_name: object.origin_object_name, destination_schema_name: object.destination_schema_name, destination_object_name: object.destination_object_name, columns: object.columns, query });
      }
      const pipelinerun_parameters: JobParametersOracle = {
        name: pipeline.name,
        pipeline_id: pipeline.pipeline_id,
        cron: pipeline.cron,
        parameters: { queued_time: new Date().toISOString(), privacy_level: pipeline.privacy_level, oracle_connectionstring_kv_name: linkedservice_config.connectionstring_azurekeyvaultsecret_name, objects: objects },
      };
      const result = await this.joborchestrator_service.createJobRun(pipeline.job_id, pipelinerun_parameters);
      if (!result) throw new CustomError('Error in creating job orchestrator run');
      console.log(`Create pipelinerun`);
      const pipelinerun = await this.pipelinerun_entity_service.createPipelineRun(pipeline.job_id, result.run_id, pipeline_id, modified_by, pipelinerun_parameters);
      if (!pipelinerun) return undefined;
      if (pipelinerun && typeof pipelinerun.modified_by === 'string') pipelinerun.modified_by = JSON.parse(pipelinerun.modified_by);
      if (pipelinerun) {
        pipelinerun.logs = await this.pipelinerunlog_entity_service.getPipelineRunLogsByRunId(pipelinerun.run_id);
      }
      return pipelinerun;
    }

    if (pipeline.job_id === this.synapse_pipeline_transform_id) {
      const pipeline_parameters = pipeline.parameters as PipelineParametersTransform;
      const objects: JobParametersObjectsArrayTransform = pipeline_parameters.objects.map(object => ({
        type: object.type,
        destination_schema_name: object.destination_schema_name,
        destination_object_name: object.destination_object_name,
        query: object.query,
      }));
      const pipelinerun_parameters: JobParametersTransform = {
        name: pipeline.name,
        pipeline_id: pipeline.pipeline_id,
        cron: pipeline.cron,
        parameters: { queued_time: new Date().toISOString(), privacy_level: pipeline.privacy_level, objects: objects },
      };
      const result = await this.joborchestrator_service.createJobRun(pipeline.job_id, pipelinerun_parameters);
      if (!result) throw new CustomError('Error in creating job orchestrator run');
      console.log(`Create pipelinerun`);
      const pipelinerun = await this.pipelinerun_entity_service.createPipelineRun(pipeline.job_id, result.run_id, pipeline_id, modified_by, pipelinerun_parameters);
      if (!pipelinerun) return undefined;
      if (pipelinerun && typeof pipelinerun.modified_by === 'string') pipelinerun.modified_by = JSON.parse(pipelinerun.modified_by);
      if (pipelinerun) {
        pipelinerun.logs = await this.pipelinerunlog_entity_service.getPipelineRunLogsByRunId(pipelinerun.run_id);
      }
      return pipelinerun;
    }
    return undefined;
  }

  async updatePipelineRun(run_id: string, state: PipelineRunState, start_time: Date | null, end_time: Date | null, estimated_duration: number | null): Promise<PipelineRun | undefined> {
    const run = await this.pipelinerun_entity_service.updatePipelineRun(run_id, state, start_time, end_time, estimated_duration);
    if (run && typeof run.modified_by === 'string') run.modified_by = JSON.parse(run.modified_by);
    if (run) {
      run.logs = await this.pipelinerunlog_entity_service.getPipelineRunLogsByRunId(run.run_id);
    }
    return run;
  }

  async updatePipelineRunState(run_id: string, state: PipelineRunState): Promise<PipelineRun | undefined> {
    const run = await this.pipelinerun_entity_service.updatePipelineRunState(run_id, state);
    if (run && typeof run.modified_by === 'string') run.modified_by = JSON.parse(run.modified_by);
    if (run) {
      run.logs = await this.pipelinerunlog_entity_service.getPipelineRunLogsByRunId(run.run_id);
    }
    return run;
  }

  async updatePipelineRunStateQueued(run_id: string, state: PipelineRunState, queued_time: Date): Promise<PipelineRun | undefined> {
    const run = await this.pipelinerun_entity_service.updatePipelineRunStateQueued(run_id, state, queued_time);
    if (run && typeof run.modified_by === 'string') run.modified_by = JSON.parse(run.modified_by);
    if (run) {
      run.logs = await this.pipelinerunlog_entity_service.getPipelineRunLogsByRunId(run.run_id);
    }
    return run;
  }

  async updatePipelineRunStateEstimating(run_id: string, state: PipelineRunState): Promise<PipelineRun | undefined> {
    const run = await this.pipelinerun_entity_service.updatePipelineRunStateEstimating(run_id, state);
    if (run && typeof run.modified_by === 'string') run.modified_by = JSON.parse(run.modified_by);
    if (run) {
      run.logs = await this.pipelinerunlog_entity_service.getPipelineRunLogsByRunId(run.run_id);
    }
    return run;
  }

  async updatePipelineRunStateStarted(run_id: string, state: PipelineRunState, start_time: Date | null, estimated_duration: number | null): Promise<PipelineRun | undefined> {
    const run = await this.pipelinerun_entity_service.updatePipelineRunStateStarted(run_id, state, start_time, estimated_duration);
    if (run && typeof run.modified_by === 'string') run.modified_by = JSON.parse(run.modified_by);
    if (run) {
      run.logs = await this.pipelinerunlog_entity_service.getPipelineRunLogsByRunId(run.run_id);
    }
    return run;
  }

  async updatePipelineRunStateCompleted(run_id: string, state: PipelineRunState, end_time: Date | null): Promise<PipelineRun | undefined> {
    const run = await this.pipelinerun_entity_service.updatePipelineRunStateCompleted(run_id, state, end_time);
    if (run && typeof run.modified_by === 'string') run.modified_by = JSON.parse(run.modified_by);
    if (run) {
      run.logs = await this.pipelinerunlog_entity_service.getPipelineRunLogsByRunId(run.run_id);
    }
    return run;
  }

  async getPipelineRunById(run_id: string): Promise<PipelineRun | null> {
    const run = await this.pipelinerun_entity_service.getPipelineRunById(run_id);
    if (run && typeof run.modified_by === 'string') run.modified_by = JSON.parse(run.modified_by);
    if (run) {
      run.logs = await this.pipelinerunlog_entity_service.getPipelineRunLogsByRunId(run.run_id);
    }
    return run;
  }

  async getPipelineRunByPipelineId(pipeline_id: string, take: number | undefined = undefined, state: PipelineRunState | undefined = undefined): Promise<PipelineRun[]> {
    const runs = await this.pipelinerun_entity_service.getPipelineRunByPipelineId(pipeline_id, take, state);
    for (const run of runs) {
      if (typeof run.modified_by === 'string') run.modified_by = JSON.parse(run.modified_by);
      run.logs = await this.pipelinerunlog_entity_service.getPipelineRunLogsByRunId(run.run_id);
    }
    return runs;
  }

  async getPipelineRunsByJobId(job_id: string): Promise<PipelineRun[]> {
    const runs = await this.pipelinerun_entity_service.getPipelineRunsByJobId(job_id);
    for (const run of runs) {
      if (typeof run.modified_by === 'string') run.modified_by = JSON.parse(run.modified_by);
      run.logs = await this.pipelinerunlog_entity_service.getPipelineRunLogsByRunId(run.run_id);
    }
    return runs;
  }

  async getOngoingPipelineRuns(): Promise<PipelineRun[]> {
    const runs = await this.pipelinerun_entity_service.getOngoingPipelineRuns();
    for (const run of runs) {
      if (typeof run.modified_by === 'string') run.modified_by = JSON.parse(run.modified_by);
      run.logs = await this.pipelinerunlog_entity_service.getPipelineRunLogsByRunId(run.run_id);
    }
    return runs;
  }

  async getPiplineRunByParametersHashAndNotFailed(job_id: string, parameters_hash: string): Promise<PipelineRun | null> {
    const run = await this.pipelinerun_entity_service.getPiplineRunByParametersHashAndNotFailed(job_id, parameters_hash);
    if (run && typeof run.modified_by === 'string') run.modified_by = JSON.parse(run.modified_by);
    if (run) {
      run.logs = await this.pipelinerunlog_entity_service.getPipelineRunLogsByRunId(run.run_id);
    }
    return run;
  }

  async getLatestPipelineRunByPipelineId(pipeline_id: string): Promise<PipelineRun | null> {
    const run = await this.pipelinerun_entity_service.getLatestPipelineRunByPipelineId(pipeline_id);
    if (run && typeof run.modified_by === 'string') run.modified_by = JSON.parse(run.modified_by);
    if (run) {
      run.logs = await this.pipelinerunlog_entity_service.getPipelineRunLogsByRunId(run.run_id);
    }
    return run;
  }
}
