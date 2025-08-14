import {Metadata} from '../db/metadata.entity';
import MetadataEntityService from '../services/MetadataEntityService';
import {DeleteResult} from 'typeorm';
import {CustomError} from '../utilities/utils';
import {MetadataSchema} from '../schemas/metadata.entity';

export interface IMetadataController {
  createMetadata(pipeline_id: string, dataobject_id: string | null, metadata: MetadataSchema): Promise<Metadata>;
}

export class MetadataController implements IMetadataController {
  private metadata_entity_service: MetadataEntityService;

  constructor(metadata_entity_service: MetadataEntityService) {
    this.metadata_entity_service = metadata_entity_service;
  }

  async createMetadata(pipeline_id: string, dataobject_id: string | null, metadata: MetadataSchema): Promise<Metadata> {
    return await this.metadata_entity_service.createMetadata(pipeline_id, dataobject_id, metadata);
  }

  async updateMetadata(metadata_id: string, pipeline_id: string, dataobject_id: string | null, metadata: MetadataSchema) {
    const metadata_existing = await this.getMetadataById(metadata_id);
    if (!metadata_existing) throw new CustomError('Metadata not found');
    return this.metadata_entity_service.updateMetadata(pipeline_id, dataobject_id, metadata);
  }

  async deleteMetadata(metadata_id: string): Promise<DeleteResult> {
    return await this.metadata_entity_service.deleteMetadata(metadata_id);
  }

  async getMetadata(metadata_id: string | undefined, pipeline_id: string | undefined, dataobject_id: string | undefined): Promise<Metadata[]> {
    return await this.metadata_entity_service.getMetadata(metadata_id, pipeline_id, dataobject_id);
  }

  async getMetadataById(metadata_id: string): Promise<Metadata | null> {
    return await this.metadata_entity_service.getMetadataById(metadata_id);
  }
}
