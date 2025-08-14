import { DataSource, type Repository } from 'typeorm';
import { DataObject } from '../db/data_object.entity';
import { v4 as uuidv4 } from 'uuid';
import { DataObjectManagedBy, DataObjectState } from '../schemas/dataobject.entity';
import { CustomError } from '../utilities/utils';

class DataObjectEntityService {
  private readonly repository: Repository<DataObject>;

  constructor(datasource: DataSource) {
    this.repository = datasource.getRepository(DataObject);
  }

  async createDataObject(dataobject_id: string | null, name: string, pipeline_id: string | null, type: string, state: DataObjectState, modified_by: { name: string; user_id: string } | null, managed_by: DataObjectManagedBy, user_groups: string[]): Promise<DataObject> {
    const object: DataObject = new DataObject();
    object.dataobject_id = dataobject_id ? dataobject_id : uuidv4().toUpperCase();
    object.pipeline_id = pipeline_id;
    object.name = name;
    object.type = type;
    object.state = state;
    object.modified_by = modified_by;
    object.user_groups = user_groups;
    object.managed_by = managed_by;
    object.uploaded_date = new Date();
    const response = await this.repository.save(object);
    if (typeof response.modified_by === 'string') response.modified_by = JSON.parse(response.modified_by);
    if (typeof response.user_groups === 'string') response.user_groups = JSON.parse(response.user_groups);

    return response;
  }

  async updateDataObject(dataobject_id: string, name: string, pipeline_id: string | null, type: string, state: DataObjectState, modified_by: { name: string; user_id: string } | null, managed_by: DataObjectManagedBy, user_groups: string[], is_enabled_for_download_apis: boolean): Promise<DataObject> {
    const object = await this.getDataObjectById(dataobject_id);
    if (!object) throw new CustomError('Data object not found');
    object.pipeline_id = pipeline_id;
    object.name = name;
    object.type = type;
    object.state = state;
    object.modified_by = modified_by;
    object.user_groups = user_groups;
    object.managed_by = managed_by;
    object.modified_date = new Date();
    object.is_enabled_for_download_apis = is_enabled_for_download_apis;
    const response = await this.repository.save(object);
    if (typeof response.modified_by === 'string') response.modified_by = JSON.parse(response.modified_by);
    if (typeof response.user_groups === 'string') response.user_groups = JSON.parse(response.user_groups);
    return response;
  }

  async publishDataObject(dataobject_id: string): Promise<DataObject> {
    const object = await this.getDataObjectById(dataobject_id);
    if (!object) throw new CustomError('Data object not found');
    object.state = DataObjectState.PUBLISHED;
    object.modified_date = new Date();
    const response = await this.repository.save(object);
    if (typeof response.modified_by === 'string') response.modified_by = JSON.parse(response.modified_by);
    if (typeof response.user_groups === 'string') response.user_groups = JSON.parse(response.user_groups);

    return response;
  }

  async unPublishDataObject(dataobject_id: string): Promise<DataObject> {
    const object = await this.getDataObjectById(dataobject_id);
    if (!object) throw new CustomError('Data object not found');
    object.state = DataObjectState.UNPUBLISHED;
    object.modified_date = new Date();
    const response = await this.repository.save(object);
    if (typeof response.modified_by === 'string') response.modified_by = JSON.parse(response.modified_by);
    if (typeof response.user_groups === 'string') response.user_groups = JSON.parse(response.user_groups);

    return response;
  }

  async deletePipelineDataObjects(pipeline_id: string) {
    const dataobjects = await this.getDataObjects(pipeline_id, undefined, undefined);
    for (let dataobject of dataobjects) {
      dataobject.state = DataObjectState.DELETED;
      dataobject.deleted_date = new Date();
      dataobject = await this.repository.save(dataobject);
    }
    return dataobjects;
  }

  async deleteDataObject(dataobject_id: string) {
    const object = await this.getDataObjectById(dataobject_id);
    if (!object) throw new CustomError('Data object not found');
    object.state = DataObjectState.DELETED;
    object.deleted_date = new Date();
    const response = await this.repository.save(object);
    if (typeof response.modified_by === 'string') response.modified_by = JSON.parse(response.modified_by);
    if (typeof response.user_groups === 'string') response.user_groups = JSON.parse(response.user_groups);

    return response;
  }

  async getDataObjects(pipeline_id: string | undefined, type: string | undefined, state: DataObjectState | undefined): Promise<DataObject[]> {
    const responses = await this.repository.find({ where: { pipeline_id, type, state } });
    for (const response of responses) {
      if (typeof response.modified_by === 'string') response.modified_by = JSON.parse(response.modified_by);
      if (typeof response.user_groups === 'string') response.user_groups = JSON.parse(response.user_groups);
    }
    return responses;
  }

  async getDataObjectById(dataobject_id: string | undefined): Promise<DataObject | null> {
    const response = await this.repository.findOneBy({ dataobject_id });
    if (response && typeof response.modified_by === 'string') response.modified_by = JSON.parse(response.modified_by);
    if (response && typeof response.user_groups === 'string') response.user_groups = JSON.parse(response.user_groups);
    return response;
  }

  async getDataObjectByName(name: string | undefined): Promise<DataObject | null> {
    const response = await this.repository.findOneBy({ name });
    if (response && typeof response.modified_by === 'string') response.modified_by = JSON.parse(response.modified_by);
    if (response && typeof response.user_groups === 'string') response.user_groups = JSON.parse(response.user_groups);
    return response;
  }
}

export default DataObjectEntityService;
