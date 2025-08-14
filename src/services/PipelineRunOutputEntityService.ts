import {DataSource, type Repository} from 'typeorm';
import {PipelineRunOutput, PipelineRunOutputType} from '../db/pipeline_run_output.entity';
import {v4 as uuidv4} from 'uuid';

class PipelineRunOutputEntityService {
  private readonly repository: Repository<PipelineRunOutput>;

  constructor(datasource: DataSource) {
    this.repository = datasource.getRepository(PipelineRunOutput);
  }

  async createPipelineRunOutput(run_id: string, content_type: PipelineRunOutputType, content_location: string, content_size: string | null): Promise<PipelineRunOutput> {
    const object: PipelineRunOutput = new PipelineRunOutput();
    object.output_id = uuidv4().toUpperCase();
    object.run_id = run_id;
    object.type = content_type;
    object.location = content_location;
    object.size = content_size;

    return await this.repository.save(object);
  }

  async getPipelineRunOutputByRunId(run_id: string): Promise<PipelineRunOutput | null> {
    return await this.repository.findOneBy({run_id: run_id});
  }
}

export default PipelineRunOutputEntityService;
