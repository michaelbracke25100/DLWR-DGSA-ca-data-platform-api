import {LinkedService} from '../db/linkedservice.entity';
import {DataSource, Repository} from 'typeorm';
import {LinkedServiceType, LinkedServiceState} from '../schemas/linkedservice.entity';
import {CustomError} from '../utilities/utils';

class LinkedServiceEntityService {
  private readonly repository: Repository<LinkedService>;
  constructor(datasource: DataSource) {
    this.repository = datasource.getRepository(LinkedService);
  }

  // Function to set a linkedservice
  async createLinkedService(linkedservice_id: string, type: LinkedServiceType, config: object): Promise<LinkedService> {
    const linkedservice = new LinkedService();
    linkedservice.linkedservice_id = linkedservice_id;
    linkedservice.config = JSON.stringify(config);
    linkedservice.type = type;
    linkedservice.state = LinkedServiceState.CREATED;
    linkedservice.created_date = new Date();
    const response = await this.repository.save(linkedservice);
    if (typeof response.config === 'string') response.config = JSON.parse(response.config);
    return response;
  }

  // Function to delete a linkedservice
  async deleteLinkedService(linkedservice_id: string): Promise<LinkedService> {
    const linkedservice = await this.repository.findOneBy({linkedservice_id: linkedservice_id});
    if (!linkedservice) throw new CustomError('Linked Service not found');
    linkedservice.state = LinkedServiceState.DELETED;
    linkedservice.modified_date = new Date();
    linkedservice.config = JSON.stringify(linkedservice.config);
    const response = await this.repository.save(linkedservice);
    if (typeof response.config === 'string') response.config = JSON.parse(response.config);
    return response;
  }

  // Function to update a linkedservice
  async updateLinkedService(linkedservice_id: string, state: LinkedServiceState, type: LinkedServiceType): Promise<LinkedService> {
    const linkedservice = await this.repository.findOneBy({linkedservice_id});
    if (!linkedservice) throw new CustomError('Linked Service not found');

    if ((linkedservice.type as LinkedServiceType) != type) throw new CustomError('Type cannot be changed');
    linkedservice.state = state;
    linkedservice.modified_date = new Date();
    linkedservice.config = JSON.stringify(linkedservice.config);
    const response = await this.repository.save(linkedservice);
    if (typeof response.config === 'string') response.config = JSON.parse(response.config);
    return response;
  }

  // Function to update a linkedservice state
  async updateLinkedServiceState(linkedservice_id: string, state: LinkedServiceState): Promise<LinkedService> {
    const linkedservice = await this.repository.findOneBy({linkedservice_id});
    if (!linkedservice) throw new CustomError('Linked Service not found');
    linkedservice.state = state;
    linkedservice.modified_date = new Date();
    linkedservice.config = JSON.stringify(linkedservice.config);
    const response = await this.repository.save(linkedservice);
    if (typeof response.config === 'string') response.config = JSON.parse(response.config);
    return response;
  }

  async getLinkedServiceById(linkedservice_id: string): Promise<LinkedService | null> {
    const response = await this.repository.findOneBy({linkedservice_id: linkedservice_id});
    if (response && typeof response.config === 'string') response.config = JSON.parse(response.config);
    return response;
  }

  async getLinkedServices(): Promise<LinkedService[]> {
    const responses = await this.repository.find();
    for (const response of responses) {
      if (typeof response.config === 'string') response.config = JSON.parse(response.config);
    }
    return responses;
  }
}
export default LinkedServiceEntityService;
