import {DataSource, type Repository} from 'typeorm';
import {DataObjectRun, DataObjectRunState} from '../db/dataobject_run.entity';
import {JSONcompress, JSONToHash} from '../utilities/utils';

class DataObjectRunEntityService {
  private readonly repository: Repository<DataObjectRun>;

  constructor(datasource: DataSource) {
    this.repository = datasource.getRepository(DataObjectRun);
  }

  async createDataObjectRun(
    job_id: string,
    run_id: string,
    dataobject_id: string,
    modified_by: object,
    job_parameters: object,
  ): Promise<DataObjectRun | undefined> {
    const object: DataObjectRun = new DataObjectRun();
    object.job_id = job_id;
    object.run_id = run_id;
    object.dataobject_id = dataobject_id;
    object.run_parameters_compressed = JSONcompress(job_parameters);
    object.run_parameters_hash = JSONToHash(job_parameters);
    object.queued_time = new Date();
    object.state = DataObjectRunState.REQUESTED;
    object.modified_by = JSON.stringify(modified_by);
    return await this.repository.save(object);
  }
}

export default DataObjectRunEntityService;
