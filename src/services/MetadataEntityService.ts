import { DataSource, DeleteResult, type Repository } from 'typeorm';
import { Metadata } from '../db/metadata.entity';
import { v4 as uuidv4 } from 'uuid';
import { MetadataSchema } from '../schemas/metadata.entity';
import { CustomError } from '../utilities/utils';

class MetadataEntityService {
  private readonly repository: Repository<Metadata>;

  constructor(datasource: DataSource) {
    this.repository = datasource.getRepository(Metadata);
  }

  async createMetadata(pipeline_id: string | null, dataobject_id: string | null, metadata: MetadataSchema): Promise<Metadata> {
    const object: Metadata = new Metadata();
    object.metadata_id = uuidv4().toUpperCase();
    object.pipeline_id = pipeline_id;
    object.dataobject_id = dataobject_id;
    object.it_solution = metadata.it_solution;
    object.eurovoc_subjects = metadata.eurovoc_subjects;
    object.business_unit = metadata.business_unit;
    object.business_data_owner = metadata.business_data_owner;
    object.business_data_steward = metadata.business_data_steward;
    object.domain = metadata.domain;
    object.sub_domain = metadata.sub_domain;
    object.technical_data_steward = metadata.technical_data_steward;
    return await this.repository.save(object);
  }

  async updateMetadata(pipeline_id: string | null, dataobject_id: string | null, metadata: MetadataSchema): Promise<Metadata> {
    let object = await this.getOneMetadata(undefined, pipeline_id ? pipeline_id : undefined, dataobject_id ? dataobject_id : undefined);
    if (!object) {
      // try to find solely by pipeline_id
      object = await this.getOneMetadata(undefined, pipeline_id ? pipeline_id : undefined, undefined);
      // still empty, try to find solely by dataobject_id
      if (!object) object = await this.getOneMetadata(undefined, undefined, dataobject_id ? dataobject_id : undefined);
      // still empty? throw error
      if (!object) throw new CustomError('Metadata not found');
    }
    object.pipeline_id = pipeline_id;
    object.dataobject_id = dataobject_id;
    object.it_solution = metadata.it_solution;
    object.eurovoc_subjects = metadata.eurovoc_subjects;
    object.business_unit = metadata.business_unit;
    object.business_data_owner = metadata.business_data_owner;
    object.business_data_steward = metadata.business_data_steward;
    object.domain = metadata.domain;
    object.sub_domain = metadata.sub_domain;
    object.technical_data_steward = metadata.technical_data_steward;
    return await this.repository.save(object);
  }

  async deleteMetadata(metadata_id: string): Promise<DeleteResult> {
    return await this.repository.delete({ metadata_id });
  }

  async getMetadataById(metadata_id: string): Promise<Metadata | null> {
    return await this.repository.findOneBy({ metadata_id: metadata_id });
  }
  async getMetadataByPipelineId(pipeline_id: string): Promise<Metadata | null> {
    return await this.repository.findOneBy({ pipeline_id: pipeline_id });
  }

  async getMetadata(metadata_id: string | undefined, pipeline_id: string | undefined, dataobject_id: string | undefined): Promise<Metadata[]> {
    return await this.repository.find({ where: { metadata_id, pipeline_id, dataobject_id } });
  }

  async getOneMetadata(metadata_id: string | undefined, pipeline_id: string | undefined, dataobject_id: string | undefined): Promise<Metadata | null> {
    return await this.repository.findOne({ where: { metadata_id, pipeline_id, dataobject_id } });
  }
}

export default MetadataEntityService;
