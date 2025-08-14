import {PipelineRunOutput, PipelineRunOutputType} from '../db/pipeline_run_output.entity';
import PipelineRunOutputEntityService from '../services/PipelineRunOutputEntityService';

export interface IPipelineRunOutputController {
  createPipelineRunOutput(run_id: string, content_type: PipelineRunOutputType, content_location: string, content_size: string | null): Promise<PipelineRunOutput>;
}

export class PipelineRunOutputController implements IPipelineRunOutputController {
  private pipelinerunoutput_entity_service: PipelineRunOutputEntityService;

  constructor(pipelinerunoutput_entity_service: PipelineRunOutputEntityService) {
    this.pipelinerunoutput_entity_service = pipelinerunoutput_entity_service;
  }

  async createPipelineRunOutput(run_id: string, content_type: PipelineRunOutputType, content_location: string, content_size: string | null): Promise<PipelineRunOutput> {
    return await this.pipelinerunoutput_entity_service.createPipelineRunOutput(run_id, content_type, content_location, content_size);
  }

  async getPipelineRunOutputByRunId(run_id: string): Promise<PipelineRunOutput | null> {
    return await this.pipelinerunoutput_entity_service.getPipelineRunOutputByRunId(run_id);
  }
}
