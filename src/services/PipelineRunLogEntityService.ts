import {DataSource, type Repository} from 'typeorm';
import {v4 as uuidv4} from 'uuid';
import {PipelineRunLog} from '../db/pipeline_run_log.entity';

class PipelineRunLogEntityService {
  private readonly repository: Repository<PipelineRunLog>;

  constructor(datasource: DataSource) {
    this.repository = datasource.getRepository(PipelineRunLog);
  }

  async createPipelineRunLog(run_id: string, log_message: string, log_timestamp: Date): Promise<PipelineRunLog | undefined> {
    const logs = await this.repository.findBy({run_id, log_message, log_timestamp});
    if (logs.length === 0) {
      const object: PipelineRunLog = new PipelineRunLog();
      object.id = uuidv4().toUpperCase();
      object.run_id = run_id;
      object.log_message = log_message;
      object.log_timestamp = log_timestamp;
      return await this.repository.save(object);
    }
    return undefined;
  }

  async getPipelineRunLogsByRunId(run_id: string): Promise<PipelineRunLog[]> {
    return await this.repository.findBy({run_id});
  }
}

export default PipelineRunLogEntityService;
