import { PipelineRun } from '../db/pipeline_run.entity';
import JobOrchestratorService from '../services/JobOrchestratorService';
import PipelineRunEntityService from '../services/PipelineRunEntityService';
import PipelineEntityService from '../services/PipelineEntityService';
import { parseExpression } from 'cron-parser';
import PipelineRunOutputEntityService from '../services/PipelineRunOutputEntityService';
import { pipeline_parameters_oracle_schema, PipelineParametersOracle } from '../schemas/pipeline.parameters';
import { pipeline_parameters_transform_schema, PipelineParametersTransform } from '../schemas/pipeline.parameters';
import { JobParametersObjectsArrayOracle, JobParametersOracle } from '../schemas/job.parameters';
import { JobParametersObjectsArrayTransform, JobParametersTransform } from '../schemas/job.parameters';
import { PipelineRunOutputType } from '../db/pipeline_run_output.entity';
import LinkedServiceEntityService from '../services/LinkedServiceEntityService';
import { config_oraclesql_schema } from '../schemas/linkedservice.entity';
import { PipelineRunState } from '../schemas/pipeline_run.entity';
import { CustomError } from '../utilities/utils';
import { PipelineState } from '../schemas/pipeline.entity';
import PipelineRunLogEntityService from '../services/PipelineRunLogEntityService';

export interface ISchedulerController {
  createPipelineRun(job_id: string, pipeline_id: string, parameters: object): Promise<PipelineRun | undefined>;
  checkPipelines(): Promise<void>;
  checkOngoingPipelines(): Promise<void>;
  disableActivePipelines(): Promise<void>;
}

export class SchedulerController implements ISchedulerController {
  private pipeline_entity_service: PipelineEntityService;
  private pipelinerun_entity_service: PipelineRunEntityService;
  private pipelinerunlog_entity_service: PipelineRunLogEntityService;
  private joborchestrator_service: JobOrchestratorService;
  private pipelinerunoutput_entity_service: PipelineRunOutputEntityService;
  private linkedservice_entity_service: LinkedServiceEntityService;
  private synapse_pipeline_oracle_id: string;
  private synapse_pipeline_transform_id: string;
  private timeoutSeconds: number;

  constructor(
    pipeline_entity_service: PipelineEntityService,
    pipelinerun_entity_service: PipelineRunEntityService,
    pipelinerunlog_entity_service: PipelineRunLogEntityService,
    pipelinerunoutput_entity_service: PipelineRunOutputEntityService,
    joborchestrator_service: JobOrchestratorService,
    linkedservice_entity_service: LinkedServiceEntityService,
    synapse_pipeline_oracle_id: string,
    synapse_pipeline_transform_id: string,
    timeoutSeconds: number = 72000, // 20h
  ) {
    this.pipeline_entity_service = pipeline_entity_service;
    this.pipelinerun_entity_service = pipelinerun_entity_service;
    this.pipelinerunlog_entity_service = pipelinerunlog_entity_service;
    this.joborchestrator_service = joborchestrator_service;
    this.pipelinerunoutput_entity_service = pipelinerunoutput_entity_service;
    this.linkedservice_entity_service = linkedservice_entity_service;
    this.synapse_pipeline_oracle_id = synapse_pipeline_oracle_id;
    this.synapse_pipeline_transform_id = synapse_pipeline_transform_id;
    this.timeoutSeconds = timeoutSeconds;
  }

  async createPipelineRun(job_id: string, pipeline_id: string, parameters: object): Promise<PipelineRun | undefined> {
    const result = await this.joborchestrator_service.createJobRun(job_id, parameters);
    if (result) {
      const pipeline = await this.pipelinerun_entity_service.createPipelineRun(job_id, result.run_id, pipeline_id, { user_id: null, name: 'scheduled_task' }, parameters);
      if (pipeline) return pipeline;
    }
    return undefined;
  }

  //* Check all active pipelines and trigger them if needed
  async checkPipelines(): Promise<void> {
    //* Try Catch so code doesn't exit when something fails
    try {
      const pipelines = await this.pipeline_entity_service.getActivePipelines();
      const now = new Date();
      pipelines.forEach(async pipeline => {
        console.log(`Checking pipeline ${pipeline.pipeline_id}`);

        //* Try Catch so code doesn't exit when something fails
        try {
          //* If cron is filled in and state is active
          if (pipeline.cron) {
            //* Parse cron to an interval and next date
            const interval = parseExpression(pipeline.cron);
            const prevDate: Date = interval.prev().toDate();
            const latest_pipelinerun = await this.pipelinerun_entity_service.getLatestPipelineRunByPipelineId(pipeline.pipeline_id);

            //* Check if pipeline should be triggered
            if (
              //* Next Date is in the future
              prevDate.getDay() === now.getDay() &&
              prevDate.getHours() === now.getHours() &&
              prevDate <= now &&
              //* No run yet or nextDate > queued_time
              (!latest_pipelinerun || (latest_pipelinerun.end_time && prevDate > latest_pipelinerun.end_time)) &&
              //* Latest run is not ongoing
              (!latest_pipelinerun ||
                ((latest_pipelinerun.state as PipelineRunState) != PipelineRunState.QUEUED &&
                  (latest_pipelinerun.state as PipelineRunState) != PipelineRunState.ESTIMATING &&
                  (latest_pipelinerun.state as PipelineRunState) != PipelineRunState.IN_PROGRESS &&
                  (latest_pipelinerun.state as PipelineRunState) != PipelineRunState.REQUESTED))
            ) {
              console.log(`Starting pipeline ${pipeline.pipeline_id}`);
              //* Check job_id to parse correct parameters to job
              if (pipeline.job_id === this.synapse_pipeline_oracle_id) {
                const linkedservice = await this.linkedservice_entity_service.getLinkedServiceById(pipeline.linkedservice_id);
                if (linkedservice) {
                  const parsed_parameters = pipeline_parameters_oracle_schema.safeParse(pipeline.parameters);
                  const parsed_linkedservice_config = config_oraclesql_schema.safeParse(linkedservice.config);
                  if (parsed_parameters.data && parsed_linkedservice_config.data) {
                    const pipeline_parameters: PipelineParametersOracle = parsed_parameters.data;
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
                      parameters: { queued_time: new Date().toISOString(), privacy_level: pipeline.privacy_level, oracle_connectionstring_kv_name: parsed_linkedservice_config.data.connectionstring_azurekeyvaultsecret_name, objects: objects },
                    };
                    const newpipelinerun = await this.createPipelineRun(pipeline.job_id, pipeline.pipeline_id, pipelinerun_parameters);
                    if (newpipelinerun) {
                      console.log(`Pipelinerun created pipeline ${pipeline.pipeline_id}, pipelinerun ${newpipelinerun?.run_id}`);
                    } else {
                      console.error(`Pipelinerun creation failed ${pipeline.pipeline_id}`);
                    }
                  } else {
                    console.error(`Parameters or config is not valid: ${JSON.stringify(parsed_parameters.error)} | ${JSON.stringify(parsed_linkedservice_config.error)}`);
                  }
                } else {
                  console.error(`Linked Service not found`);
                }
              }

              if (pipeline.job_id === this.synapse_pipeline_transform_id) {
                const parsed_parameters = pipeline_parameters_transform_schema.safeParse(pipeline.parameters);
                if (parsed_parameters.data) {
                  const pipeline_parameters: PipelineParametersTransform = parsed_parameters.data;
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
                  const newpipelinerun = await this.createPipelineRun(pipeline.job_id, pipeline.pipeline_id, pipelinerun_parameters);
                  if (newpipelinerun) {
                    console.log(`Pipelinerun created pipeline ${pipeline.pipeline_id}, pipelinerun ${newpipelinerun?.run_id}`);
                  } else {
                    console.error(`Pipelinerun creation failed ${pipeline.pipeline_id}`);
                  }
                } else {
                  console.error(`Parameters or config is not valid: ${JSON.stringify(parsed_parameters.error)}`);
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error while checking pipeline (${pipeline.pipeline_id}) to run: ${JSON.stringify(error)}`);
        }
      });
    } catch (error) {
      console.error(`Error while checking pipelines to run: ${JSON.stringify(error)}`);
    }
  }

  //* Check all ongoing pipeline runs and update their state (timeout = 1h)
  async checkOngoingPipelines(): Promise<void> {
    //* Try Catch so code doesn't exit when something fails
    try {
      console.log(`Checking pipelines`);
      const pipelineRuns = await this.pipelinerun_entity_service.getOngoingPipelineRuns();
      console.log(`Pipelines to check: ${JSON.stringify(pipelineRuns)}`);
      const now = Date.now();
      const now_date = new Date();
      pipelineRuns.forEach(async run => {
        //* Try Catch so code doesn't exit when something fails
        try {
          const job_run = await this.joborchestrator_service.getJobRunById(run.job_id, run.run_id);
          console.log(`Job orch response: ${JSON.stringify(job_run)}`);
          if (job_run) {
            console.log(`Checking pipelinerun state: ${job_run.run_id}`);
            if (job_run.metadata.logs) {
              for (const log of job_run.metadata.logs) {
                const log_created = await this.pipelinerunlog_entity_service.createPipelineRunLog(job_run.run_id, log.log_message, log.log_timestamp);
                if (log_created) {
                  console.log(`Update log run_id: ${job_run.run_id}`);
                } else {
                  console.log(`Update failed log run_id: ${job_run.run_id}`);
                }
              }
            }
            if (run.state != (job_run.run_state as PipelineRunState)) {
              await this.pipelinerun_entity_service.updatePipelineRun(
                run.run_id,
                job_run.run_state as PipelineRunState,
                job_run.metadata.start_time ? new Date(job_run.metadata.start_time) : null,
                job_run.metadata.end_time ? new Date(job_run.metadata.end_time) : null,
                job_run.metadata.estimated_duration,
              );

              //* Get the output of the Run and save it
              if ((job_run?.run_state as PipelineRunState) === PipelineRunState.SUCCESSFUL) {
                if (job_run.run_id != null && job_run.result?.type != null && job_run.result?.location != null && job_run.result?.size != null) {
                  const output = await this.pipelinerunoutput_entity_service.createPipelineRunOutput(run.run_id, job_run.result.type as PipelineRunOutputType, job_run.result.location, job_run.result.size);
                  if (output) {
                    console.log(`Update output run_id: ${output.run_id}`);
                  } else {
                    console.log(`Update failed output run_id: ${run.run_id}`);
                  }
                }
              }
            }
            if (!run.queued_time) throw new CustomError(`Queued time is null for: ${run.run_id}`);
            if (now - new Date(run.queued_time).getTime() > this.timeoutSeconds * 1000) {
              await this.pipelinerun_entity_service.updatePipelineRunStateCompleted(run.run_id, PipelineRunState.FAILED, now_date);
              await this.pipelinerunlog_entity_service.createPipelineRunLog(run.run_id, 'Pipeline not started, timeout reached', new Date());

              console.error(`Error JobRun (${run.run_id}): Timeout reached`);
            }
          }
        } catch (error: unknown) {
          console.error(`Error while checking pipeline (${run.pipeline_id}) to run: ${JSON.stringify(error)}`);
        }
      });
    } catch (error: unknown) {
      console.error(`Error while checking pipelines to run: ${JSON.stringify(error)}`);
    }
  }

  async disableActivePipelines() {
    const active_pipelines = await this.pipeline_entity_service.getActivePipelines();
    for (const pipeline of active_pipelines) {
      await this.pipeline_entity_service.updatePipeline(
        pipeline.pipeline_id,
        pipeline.job_id,
        PipelineState.DISABLED,
        pipeline.name,
        pipeline.description,
        typeof pipeline.modified_by === 'object' ? pipeline.modified_by : JSON.parse(pipeline.modified_by),
        pipeline.cron,
        pipeline.linkedservice_id,
        typeof pipeline.parameters === 'string' ? JSON.parse(pipeline.parameters) : pipeline.parameters,
        typeof pipeline.user_groups === 'string' ? [pipeline.user_groups] : pipeline.user_groups,
      );
    }
  }
}
