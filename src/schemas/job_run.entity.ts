import {PipelineRunState} from './pipeline_run.entity';

export class JobRun {
  run_id: string;

  job_id: string;

  run_parameters_compressed: string;

  run_parameters_hash: string;

  executor: string;

  state: PipelineRunState;

  queued_time: string | null;

  start_time: string | null;

  estimated_duration: number | null;

  end_time: string | null;

  priority: number;

  retry_count: number;
}
