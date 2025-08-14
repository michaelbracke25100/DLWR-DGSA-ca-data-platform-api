import {
  BlobBeginCopyFromURLResponse,
  BlobDeleteIfExistsResponse,
  AppendBlobAppendBlockResponse,
  BlockBlobCommitBlockListResponse,
} from '@azure/storage-blob';
import {DataObject, DataObjectManagedBy as DataObjectManagedByEntity} from '../db/data_object.entity';
import {DataObjectManagedBy, DataObjectState} from '../schemas/dataobject.entity';
import {MetadataSchema} from '../schemas/metadata.entity';
import DataObjectEntityService from '../services/DataObjectEntityService';
import MetadataEntityService from '../services/MetadataEntityService';
import PipelineEntityService from '../services/PipelineEntityService';
import StorageService from '../services/StorageService';
import {CustomError} from '../utilities/utils';
import {PipelineState} from '../schemas/pipeline.entity';
import {randomUUID} from 'crypto';
import DataObjectRunEntityService from '../services/DataObjectRunEntityService';
import JobOrchestratorService from '../services/JobOrchestratorService';

export interface IDataObjectController {
  createPipelineDataObjects(pipeline_id: string, data_objects_parameters: { origin_name: string; destination_name: string }[], user_groups: string[] | null): Promise<DataObject[]>;
  createDataObject(dataobject_id: string | null, name: string, pipeline_id: string | null, state: DataObjectState, modified_by: object | null, metadata: MetadataSchema, user_groups: string[] | null, managed_by: DataObjectManagedBy): Promise<DataObject>;
  updateDataObject(dataobject_id: string, name: string, pipeline_id: string | null, type: string, state: DataObjectState, modified_by: object | null, metadata: MetadataSchema, user_groups: string[] | null, managed_by: DataObjectManagedBy, is_enabled_for_download_apis: boolean): Promise<DataObject>;
  updateDataObjectMetadata(dataobject_id: string, modified_by: object | null, metadata: MetadataSchema | null, user_groups: string[] | null, managed_by: DataObjectManagedBy, is_enabled_for_download_apis: boolean): Promise<DataObject>;
  publishDataObject(dataobject_id: string): Promise<DataObject>;
  unPublishDataObject(dataobject_id: string): Promise<DataObject>;
  deleteDataObject(dataobject_id: string): Promise<boolean>;
  checkDestination(destination_name: string, pipeline_id: string | undefined): Promise<boolean>;
  checkOrigin(origin_name: string, pipeline_id: string | undefined): Promise<boolean>;
  getDataObjects(pipeline_id: string | undefined, type: string | undefined, state: DataObjectState | undefined): Promise<DataObject[]>;
  getDataObjectById(dataobject_id: string): Promise<DataObject>;
  getDataObjectsEffectiveUserGroups(pipeline_id: string | undefined, type: string | undefined, state: DataObjectState | undefined): Promise<DataObject[]>;
  downloadDataObject(storage_name: string, container: string, name: string): Promise<{ Stream: NodeJS.ReadableStream | null; DataObject: DataObject | null; contentType: string | null }>;
  putBlock(storage_name: string, container_name: string, blob_name: string, block_id: string, blockData: Buffer | Uint8Array): Promise<{ status: string; message: string }>;
  putBlockList(storage_name: string, container_name: string, blob_name: string, block_list: string[]): Promise<{ status: string; message: string }>;
}

export class DataObjectController implements IDataObjectController {
  private dataobject_entity_service: DataObjectEntityService;
  private pipeline_entity_service: PipelineEntityService;
  private metadata_entity_service: MetadataEntityService;
  private storage_service: StorageService;
  private st_privint_name: string;
  private st_publext_name: string;
  private dataobjectrun_entity_service: DataObjectRunEntityService;
  private joborchestrator_service: JobOrchestratorService;
  private download_job_id: string;

  constructor(
    dataobject_entity_service: DataObjectEntityService,
    pipeline_entity_service: PipelineEntityService,
    metadata_entity_service: MetadataEntityService,
    storage_service: StorageService,
    st_privint_name: string,
    st_publext_name: string,
    dataobjectrun_entity_service: DataObjectRunEntityService,
    joborchestrator_service: JobOrchestratorService,
    download_job_id: string,
  ) {
    this.dataobject_entity_service = dataobject_entity_service;
    this.pipeline_entity_service = pipeline_entity_service;
    this.metadata_entity_service = metadata_entity_service;
    this.storage_service = storage_service;
    this.st_privint_name = st_privint_name;
    this.st_publext_name = st_publext_name;
    this.dataobjectrun_entity_service = dataobjectrun_entity_service;
    this.joborchestrator_service = joborchestrator_service;
    this.download_job_id = download_job_id;
  }

  async createPipelineDataObjects(pipeline_id: string, data_objects_parameters: { origin_name: string; destination_name: string }[], user_groups: string[]): Promise<DataObject[]> {
    const data_objects: DataObject[] = [];
    await this.dataobject_entity_service.deletePipelineDataObjects(pipeline_id);
    for (let index = 0; index < data_objects_parameters.length; index++) {
      const element = data_objects_parameters[index];

      //In case there is no origin, take the destination as filename
      const filename = element.origin_name === 'N/A' ? element.destination_name : element.origin_name;

      const dataobject = await this.dataobject_entity_service.createDataObject(null, `${filename}.parquet`, pipeline_id, 'PARQUET', DataObjectState.UNPUBLISHED, null, DataObjectManagedBy.PIPELINE, user_groups);

      data_objects.push(dataobject);
    }
    return data_objects;
  }

  async createDataObject(dataobject_id: string | null, name: string, pipeline_id: string | null, state: DataObjectState, modified_by: { name: string; user_id: string } | null, metadata: MetadataSchema, user_groups: string[], managed_by: DataObjectManagedBy): Promise<DataObject> {
    const extension = name.split('.').pop()?.toUpperCase();
    const dataobject = await this.dataobject_entity_service.createDataObject(dataobject_id, name, pipeline_id, extension ? extension : 'OTHER', state, modified_by, managed_by, user_groups);
    const metadata_entity = await this.metadata_entity_service.createMetadata(null, dataobject.dataobject_id, metadata);
    dataobject.metadata = metadata_entity;
    return dataobject;
  }

  async updateDataObject(dataobject_id: string, name: string, pipeline_id: string | null, type: string, state: DataObjectState, modified_by: { name: string; user_id: string } | null, metadata: MetadataSchema, user_groups: string[], managed_by: DataObjectManagedBy, is_enabled_for_download_apis: boolean): Promise<DataObject> {
    const dataobject = await this.dataobject_entity_service.updateDataObject(dataobject_id, name, pipeline_id, type, state, modified_by, managed_by, user_groups, is_enabled_for_download_apis);
    const metadata_entity = await this.metadata_entity_service.updateMetadata(null, dataobject.dataobject_id, metadata);
    dataobject.metadata = metadata_entity;
    return dataobject;
  }

  async updateDataObjectMetadata(dataobject_id: string, modified_by: { name: string; user_id: string } | null, metadata: MetadataSchema, user_groups: string[], managed_by: DataObjectManagedBy, is_enabled_for_download_apis: boolean): Promise<DataObject> {
    const dataobject = await this.dataobject_entity_service.getDataObjectById(dataobject_id);
    if (dataobject === null) throw new CustomError('Data Object not found');
    const result = await this.dataobject_entity_service.updateDataObject(dataobject_id, dataobject?.name, dataobject?.pipeline_id, dataobject?.type, dataobject?.state, modified_by, managed_by, user_groups, is_enabled_for_download_apis);
    result.metadata = await this.metadata_entity_service.updateMetadata(dataobject.pipeline_id ?? null, dataobject.dataobject_id ?? null, metadata);

    // If the data object is a parquet file and downloads are enabled, 
    // trigger the Synapse pipeline to prepare the download files.

    await this.handleParquet(dataobject, result);

    return result;
  }

  async publishDataObject(dataobject_id: string) {
    let dataobject = await this.dataobject_entity_service.getDataObjectById(dataobject_id);
    if (!dataobject) throw new CustomError('Data Object not found');

    if (await this.publishDataObjectInStorage(dataobject.name))
      dataobject = await this.dataobject_entity_service.publishDataObject(dataobject_id);

    const metadata_entity = await this.metadata_entity_service.getOneMetadata(undefined, undefined, dataobject.dataobject_id);
    dataobject.metadata = metadata_entity;

    return dataobject;
  }

  async unPublishDataObject(dataobject_id: string) {
    let dataobject = await this.dataobject_entity_service.getDataObjectById(dataobject_id);
    if (!dataobject) throw new CustomError('Data Object not found');

    if (await this.UnpublishDataObjectInStorage(dataobject.name))
      dataobject = await this.dataobject_entity_service.unPublishDataObject(dataobject_id);

    const metadata_entity = await this.metadata_entity_service.getOneMetadata(undefined, undefined, dataobject.dataobject_id);
    dataobject.metadata = metadata_entity;
    return dataobject;
  }

  async deleteDataObject(dataobject_id: string): Promise<boolean> {
    let dataobject = await this.dataobject_entity_service.getDataObjectById(dataobject_id);
    if (!dataobject) throw new CustomError('Data Object not found');
    if ((dataobject.state as DataObjectState) === DataObjectState.PUBLISHED) throw new CustomError('Data Object is published');

    if (await this.DeleteDataObjectInStorage(dataobject.name))
      dataobject = await this.dataobject_entity_service.deleteDataObject(dataobject_id);


    const metadata_entity = await this.metadata_entity_service.getOneMetadata(undefined, undefined, dataobject.dataobject_id);
    dataobject.metadata = metadata_entity;
    return true;
  }

  async checkDestination(destination_name: string, pipeline_id: string | undefined): Promise<boolean> {
    const destination_schema: string = destination_name.split('.')[0];
    const destination_table: string = destination_name.split('.')[1];
    const pipeline_check = await this.pipeline_entity_service.getPipelineBySchemaAndTableName(destination_schema, destination_table, PipelineState.ENABLED, pipeline_id);

    if (pipeline_check) return true;
    return false;
  }
  async checkOrigin(origin_name: string, pipeline_id: string | undefined): Promise<boolean> {
    const origin_schema: string = origin_name.split('.')[0];
    const origin_table: string = origin_name.split('.')[1];
    const pipeline_check = await this.pipeline_entity_service.getPipelineBySchemaAndTableName(origin_schema, origin_table, PipelineState.ENABLED, pipeline_id);
    if (pipeline_check) return true;
    return false;
  }

  async getDataObjects(pipeline_id: string | undefined, type: string | undefined, state: DataObjectState | undefined): Promise<DataObject[]> {
    const dataobjects = await this.dataobject_entity_service.getDataObjects(pipeline_id, type, state);
    for (const dataobject of dataobjects) {
      let metadata_entity;
      if (dataobject.managed_by === DataObjectManagedByEntity.DATAOBJECT) metadata_entity = await this.metadata_entity_service.getOneMetadata(undefined, undefined, dataobject.dataobject_id);
      else if (dataobject.managed_by === DataObjectManagedByEntity.PIPELINE && dataobject.pipeline_id) metadata_entity = await this.metadata_entity_service.getOneMetadata(undefined, dataobject.pipeline_id, undefined);
      dataobject.metadata = metadata_entity ?? null;
    }
    return dataobjects;
  }

  async getDataObjectsEffectiveUserGroups(pipeline_id: string | undefined, type: string | undefined, state: DataObjectState | undefined): Promise<DataObject[]> {
    const dataobjects = await this.dataobject_entity_service.getDataObjects(pipeline_id, type, state);

    for (const dataobject of dataobjects) {
      let metadata_entity;
      if (dataobject.managed_by === DataObjectManagedByEntity.DATAOBJECT) metadata_entity = await this.metadata_entity_service.getOneMetadata(undefined, undefined, dataobject.dataobject_id);
      else if (dataobject.managed_by === DataObjectManagedByEntity.PIPELINE && dataobject.pipeline_id) metadata_entity = await this.metadata_entity_service.getOneMetadata(undefined, dataobject.pipeline_id, undefined);
      dataobject.metadata = metadata_entity ?? null;
    }

    return dataobjects;
  }

  async getDataObjectById(dataobject_id: string): Promise<DataObject> {
    const dataobject = await this.dataobject_entity_service.getDataObjectById(dataobject_id);
    if (!dataobject) throw new CustomError('Data object not found');
    const metadata_entity = await this.metadata_entity_service.getOneMetadata(undefined, undefined, dataobject.dataobject_id);
    dataobject.metadata = metadata_entity;
    return dataobject;
  }

  async publishDataObjectInStorage(dataobject_name: string): Promise<boolean> {
    const copy_result = await this.storage_service.copyBlob(this.st_privint_name, 'files', dataobject_name, this.st_publext_name, 'files', dataobject_name);
    if (copy_result) return true;
    return false;
  }

  async UnpublishDataObjectInStorage(dataobject_name: string): Promise<boolean> {
    const delete_result = await this.storage_service.deleteBlob(this.st_publext_name, 'files', dataobject_name);
    if (delete_result) return true;
    return false;
  }

  async DeleteDataObjectInStorage(dataobject_name: string): Promise<boolean> {
    // copy to archive
    const copy_result = await this.storage_service.copyBlob(this.st_privint_name, 'files', dataobject_name, this.st_privint_name, 'files', `archive/${randomUUID()}_${dataobject_name}`);
    // remove from int storage 
    const delete_result = await this.storage_service.deleteBlob(this.st_privint_name, 'files', dataobject_name);
    if (delete_result) return true;
    return false;
  }

  async downloadDataObject(storage_name: string, container: string, name: string): Promise<{ Stream: NodeJS.ReadableStream | null; DataObject: DataObject | null; contentType: string | null }> {
    const fileData = await this.storage_service.getStream(storage_name, container, name);
    if (!fileData.Stream) throw new CustomError('File not found');
    const dataobject = await this.dataobject_entity_service.getDataObjectByName(name);
    if (!dataobject) throw new CustomError('Data object for path not found');

    if (dataobject.pipeline_id && dataobject.managed_by === (DataObjectManagedBy.PIPELINE as DataObjectManagedBy)) {
      const pipeline = await this.pipeline_entity_service.getPipelineById(dataobject.pipeline_id);
      if (pipeline) {
        dataobject.user_groups = pipeline.user_groups;
      }
    }

    return {
      Stream: fileData.Stream,
      DataObject: dataobject,
      contentType: fileData.contentType,
    };
  }

  async putBlock(storage_name: string, container_name: string, blob_name: string, block_id: string, blockData: Buffer | Uint8Array): Promise<{ status: string; message: string }> {
    const check = await this.storage_service.blobExists(storage_name, container_name, blob_name);

    if (check) return { status: 'FAILED', message: 'Blob already exists' };
    await this.storage_service.putBlock(storage_name, container_name, blob_name, block_id, blockData);
    return { status: 'SUCCESS', message: 'Block added sucessfully.' };
  }

  async putBlockList(storage_name: string, container_name: string, blob_name: string, block_list: string[]): Promise<{ status: string; message: string }> {
    const check = await this.storage_service.blobExists(storage_name, container_name, blob_name);

    if (check) return { status: 'FAILED', message: 'Blob already exists' };
    await this.storage_service.putBlockList(storage_name, container_name, blob_name, block_list);
    return { status: 'SUCCESS', message: 'List committed sucessfully.' };
  }

  async handleParquet(dataobject: {name: string}, result: {dataobject_id?: string; modified_by?: object; is_enabled_for_download_apis: boolean}): Promise<void> {
    const PARQUET_EXT = '.parquet';
    const container = this.st_publext_name;
    const folder = 'files';

    // only act for .parquet (case‑insensitive), bail fast otherwise
    const name = dataobject?.name ?? '';
    if (!name.toLowerCase().endsWith(PARQUET_EXT)) return;

    // If downloads are enabled, trigger the pipeline and return
    if (result?.is_enabled_for_download_apis) {
      try {
        const parameters = {
          name,
          dataobject_id: result.dataobject_id,
          parameters: {
            queued_time: new Date().toISOString(),
            storage_privint_name: this.st_privint_name,
            storage_publext_name: this.st_publext_name,
            blob_name: name,
          },
        };
        const run = await this.joborchestrator_service.createJobRun(this.download_job_id, parameters);
        if (run?.run_id && result.dataobject_id) {
          await this.dataobjectrun_entity_service.createDataObjectRun(
            this.download_job_id,
            run.run_id,
            result.dataobject_id,
            result.modified_by ?? {},
            parameters,
          );
        }
      } catch (err) {
        console.log('Failed to trigger download pipeline', {err});
      }
      return;
    }

    // Otherwise, delete any previously generated CSV/JSON siblings if they exist
    const base = name.slice(0, -PARQUET_EXT.length);
    const targets = [`${base}.csv`, `${base}.json`];

    try {
      // Check existence in parallel
      const exists = await Promise.all(targets.map(f => this.storage_service.blobExists(container, folder, f)));

      // Delete only those that exist (run deletions in parallel; don't fail the whole call if one delete fails)
      const deletions = targets.filter((_, i) => exists[i]).map(f => this.storage_service.deleteBlob(container, folder, f));

      if (deletions.length > 0) {
        await Promise.allSettled(deletions);
      }
    } catch (err) {
      console.log('Failed to clean up download files', {base, err});
    }
  }
}
