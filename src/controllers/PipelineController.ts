import {Pipeline} from '../db/pipeline.entity';
import KeyvaultService from '../services/KeyvaultService';
import PipelineEntityService from '../services/PipelineEntityService';
import LinkedServiceEntityService from '../services/LinkedServiceEntityService';
import {PipelinePrivacyLevel, PipelineState, PipelineType} from '../schemas/pipeline.entity';
import MetadataEntityService from '../services/MetadataEntityService';
import {MetadataSchema} from '../schemas/metadata.entity';
import {CustomError} from '../utilities/utils';

export interface IPipelineController {
  createPipeline(
    job_id: string,
    name: string,
    description: string | null,
    modified_by: object | null,
    owner: object | null,
    privacy_level: string,
    cron: string | null,
    type: PipelineType,
    linkedservice_id: string | null | undefined,
    parameters: object,
    metadata: MetadataSchema,
    user_groups: string[] | null,
  ): Promise<Pipeline>;
  deletePipeline(pipeline_id: string): Promise<Pipeline | undefined>;
  updatePipeline(
    pipeline_id: string,
    job_id: string,
    state: string,
    privacy_level: string,
    name: string,
    description: string | null,
    modified_by: object | null,
    cron: string | null,
    linkedservice_id: string | null | undefined,
    parameters: object,
    metadata: MetadataSchema,
    user_groups: string[] | null,
  ): Promise<Pipeline>;
  getPipelineByJobId(job_id: string): Promise<Pipeline[]>;
  getPipelines(take: number | undefined, pipeline_id: string | undefined, job_id: string | undefined, linkedservice_id: string | undefined, name: string | undefined, state: string | undefined, privacy_level: string | undefined): Promise<Pipeline[]>;
  getPipelineById(pipeline_id: string): Promise<Pipeline | null>;
}

export class PipelineController implements IPipelineController {
  private pipeline_entity_service: PipelineEntityService;
  private keyvault_service: KeyvaultService;
  private linkedservice_entity_service: LinkedServiceEntityService;
  private metadata_entity_service: MetadataEntityService;

  constructor(pipeline_entity_service: PipelineEntityService, keyvault_service: KeyvaultService, linkedservice_entity_service: LinkedServiceEntityService, metadata_entity_service: MetadataEntityService) {
    this.pipeline_entity_service = pipeline_entity_service;
    this.keyvault_service = keyvault_service;
    this.linkedservice_entity_service = linkedservice_entity_service;
    this.metadata_entity_service = metadata_entity_service;
  }

  async createPipeline(
    job_id: string,
    name: string,
    description: string | null,
    modified_by: object | null,
    owner: object | null,
    privacy_level: PipelinePrivacyLevel,
    cron: string | null,
    type: PipelineType,
    linkedservice_id: string,
    parameters: object,
    metadata: MetadataSchema,
    user_groups: string[] | null,
  ): Promise<Pipeline> {
    const pipelines_check = await this.pipeline_entity_service.getPipelines(undefined, undefined, undefined, undefined, name, undefined, undefined);
    if (pipelines_check.length > 0) throw new CustomError('Pipeline name already exists');
    if (linkedservice_id) {
      const linkedservice = await this.linkedservice_entity_service.getLinkedServiceById(linkedservice_id);
      if (!linkedservice) throw new CustomError('Linked Service not found');
    }
    const pipeline_entity = await this.pipeline_entity_service.createPipeline(job_id, name, description, modified_by, owner, privacy_level, cron, type, linkedservice_id, parameters, user_groups);
    const metadata_entity = await this.metadata_entity_service.createMetadata(pipeline_entity.pipeline_id, null, metadata);
    pipeline_entity.metadata = metadata_entity;
    if (typeof pipeline_entity.parameters === 'string') pipeline_entity.parameters = JSON.parse(pipeline_entity.parameters);
    if (typeof pipeline_entity.modified_by === 'string') pipeline_entity.modified_by = JSON.parse(pipeline_entity.modified_by);
    if (typeof pipeline_entity.owner === 'string') pipeline_entity.owner = JSON.parse(pipeline_entity.owner);
    if (typeof pipeline_entity.user_groups === 'string') pipeline_entity.user_groups = JSON.parse(pipeline_entity.user_groups);
    return pipeline_entity;
  }

  async deletePipeline(pipeline_id: string): Promise<Pipeline | undefined> {
    const pipeline = await this.pipeline_entity_service.deletePipeline(pipeline_id);
    if (!pipeline) throw new CustomError('Pipeline not found');
    if (typeof pipeline.parameters === 'string') pipeline.parameters = JSON.parse(pipeline.parameters);
    if (typeof pipeline.modified_by === 'string') pipeline.modified_by = JSON.parse(pipeline.modified_by);
    if (typeof pipeline.owner === 'string') pipeline.owner = JSON.parse(pipeline.owner);
    if (typeof pipeline.user_groups === 'string') pipeline.user_groups = JSON.parse(pipeline.user_groups);

    const metadata = await this.metadata_entity_service.getMetadataByPipelineId(pipeline.pipeline_id);
    if (!metadata) throw new CustomError('Metadata not found');
    pipeline.metadata = metadata;
    return pipeline;
  }

  async updatePipeline(
    pipeline_id: string,
    job_id: string,
    state: PipelineState,
    privacy_level: PipelinePrivacyLevel,
    name: string,
    description: string | null,
    modified_by: object | null,
    cron: string | null,
    linkedservice_id: string,
    parameters: object,
    metadata: MetadataSchema,
    user_groups: string[] | null,
  ): Promise<Pipeline> {
    const pipeline = await this.getPipelineById(pipeline_id);
    if (!pipeline) throw new CustomError('Pipeline not found');
    if (pipeline.privacy_level != privacy_level) throw new CustomError('Cannot change privacy level');

    const pipeline_entity = await this.pipeline_entity_service.updatePipeline(pipeline_id, job_id, state, name, description, modified_by, cron, linkedservice_id, parameters, user_groups);
    if (!pipeline_entity) throw new CustomError('Pipeline not updated');
    if (typeof pipeline_entity.parameters === 'string') pipeline_entity.parameters = JSON.parse(pipeline_entity.parameters);
    if (typeof pipeline_entity.modified_by === 'string') pipeline_entity.modified_by = JSON.parse(pipeline_entity.modified_by);
    if (typeof pipeline_entity.owner === 'string') pipeline_entity.owner = JSON.parse(pipeline_entity.owner);
    if (typeof pipeline_entity.user_groups === 'string') pipeline_entity.user_groups = JSON.parse(pipeline_entity.user_groups);

    const metadata_entity = await this.metadata_entity_service.updateMetadata(pipeline_entity.pipeline_id, null, metadata);
    if (!metadata_entity) throw new CustomError('Metadata not found');
    pipeline_entity.metadata = metadata_entity;
    return pipeline_entity;
  }

  async getPipelineByJobId(job_id: string): Promise<Pipeline[]> {
    const pipelines = await this.pipeline_entity_service.getPipelineByJobId(job_id);
    for (const pipeline of pipelines) {
      const metadata = await this.metadata_entity_service.getMetadataByPipelineId(pipeline.pipeline_id);
      if (!metadata) throw new CustomError('Metadata not found');
      pipeline.metadata = metadata;
      if (typeof pipeline.parameters === 'string') pipeline.parameters = JSON.parse(pipeline.parameters);
      if (typeof pipeline.modified_by === 'string') pipeline.modified_by = JSON.parse(pipeline.modified_by);
      if (typeof pipeline.owner === 'string') pipeline.owner = JSON.parse(pipeline.owner);
    }
    return pipelines;
  }

  async getPipelines(take: number | undefined, pipeline_id: string | undefined, job_id: string | undefined, linkedservice_id: string | undefined, name: string | undefined, state: PipelineState | undefined, privacy_level: PipelinePrivacyLevel | undefined): Promise<Pipeline[]> {
    const pipelines = await this.pipeline_entity_service.getPipelines(take, pipeline_id, job_id, linkedservice_id, name, state, privacy_level);
    for (const pipeline of pipelines) {
      const metadata = await this.metadata_entity_service.getMetadataByPipelineId(pipeline.pipeline_id);
      if (!metadata) throw new CustomError('Metadata not found');
      pipeline.metadata = metadata;
      if (typeof pipeline.parameters === 'string') pipeline.parameters = JSON.parse(pipeline.parameters);
      if (typeof pipeline.modified_by === 'string') pipeline.modified_by = JSON.parse(pipeline.modified_by);
      if (typeof pipeline.owner === 'string') pipeline.owner = JSON.parse(pipeline.owner);
    }
    return pipelines;
  }

  async getPipelineById(pipeline_id: string): Promise<Pipeline | null> {
    const pipeline = await this.pipeline_entity_service.getPipelineById(pipeline_id);
    if (!pipeline) return null;
    const metadata = await this.metadata_entity_service.getMetadataByPipelineId(pipeline.pipeline_id);
    if (!metadata) throw new CustomError('Metadata not found');
    pipeline.metadata = metadata;
    if (typeof pipeline.parameters === 'string') pipeline.parameters = JSON.parse(pipeline.parameters);
    if (typeof pipeline.modified_by === 'string') pipeline.modified_by = JSON.parse(pipeline.modified_by);
    if (typeof pipeline.owner === 'string') pipeline.owner = JSON.parse(pipeline.owner);
    return pipeline;
  }
}
