import KeyvaultService from '../services/KeyvaultService';
import PipelineEntityService from '../services/PipelineEntityService';
import { LinkedService } from '../db/linkedservice.entity';
import LinkedServiceEntityService from '../services/LinkedServiceEntityService';
import { config_oraclesql_management_schema, config_oraclesql_schema, ConfigOracleSqlManagement, LinkedServiceState, LinkedServiceType } from '../schemas/linkedservice.entity';
import { connectionstringToDetails, CustomError } from '../utilities/utils';
import { v4 as uuidv4 } from 'uuid';
import { AzureSynapseService } from '../services/AzureSynapseService';

export interface ILinkedServiceController {
  getLinkedServices(): Promise<LinkedService[]>;
  getLinkedServiceById(linkedservice_id: string): Promise<LinkedService | null>;
  createLinkedService(type: LinkedServiceType, config: object): Promise<LinkedService | undefined>;
  updateLinkedService(linkedservice_id: string, state: LinkedServiceState, type: LinkedServiceType, config: object): Promise<LinkedService | undefined>;
  updateLinkedServiceState(linkedservice_id: string, state: LinkedServiceState): Promise<LinkedService | undefined>;
  deleteLinkedService(linkedservice_id: string): Promise<LinkedService | undefined>;
  testConnectionstring(linkedservice_id: string): Promise<void>;
  testQuery(linkedservice_id: string): Promise<unknown>;
}

export class LinkedServiceController implements ILinkedServiceController {
  private keyvault_service: KeyvaultService;
  private linkedservice_entity_service: LinkedServiceEntityService;
  private pipeline_entity_service: PipelineEntityService;
  private azuresynapse_service: AzureSynapseService;

  constructor(linkedservice_entity_service: LinkedServiceEntityService, keyvault_service: KeyvaultService, pipeline_entity_service: PipelineEntityService, azuresynapse_service: AzureSynapseService) {
    this.keyvault_service = keyvault_service;
    this.linkedservice_entity_service = linkedservice_entity_service;
    this.pipeline_entity_service = pipeline_entity_service;
    this.azuresynapse_service = azuresynapse_service;
  }

  async getLinkedServices(): Promise<LinkedService[]> {
    const objects = await this.linkedservice_entity_service.getLinkedServices();
    for (const object of objects) {
      switch (object.type as LinkedServiceType) {
        case LinkedServiceType.ORACLESQL: {
          const config_parsed = config_oraclesql_schema.safeParse(object.config);
          if (!config_parsed.success) throw new CustomError(`Error in parsing Linked Service config 2: ${JSON.stringify(config_parsed.error)}`);
          const config_data = config_parsed.data;
          const keyvault_secret = await this.keyvault_service.getSecretValue(config_data.connectionstring_azurekeyvaultsecret_name);
          if (!keyvault_secret) throw new CustomError('Keyvault secret not found');
          const result = connectionstringToDetails(keyvault_secret);
          const config: ConfigOracleSqlManagement = { host: result.host, port: result.port, database: result.database, user: result.user, password: null };
          object.config = config;
          break;
        }
        default:
          break;
      }
    }
    return objects;
  }
  async getLinkedServiceById(linkedservice_id: string): Promise<LinkedService | null> {
    const object = await this.linkedservice_entity_service.getLinkedServiceById(linkedservice_id);
    if (!object) return null;
    switch (object.type as LinkedServiceType) {
      case LinkedServiceType.ORACLESQL: {
        const config_parsed = config_oraclesql_schema.safeParse(object.config);
        if (!config_parsed.success) throw new CustomError(`Error in parsing Linked Service config 3: ${JSON.stringify(config_parsed.error)}`);
        const config_data = config_parsed.data;
        const keyvault_secret = await this.keyvault_service.getSecretValue(config_data.connectionstring_azurekeyvaultsecret_name);
        if (!keyvault_secret) throw new CustomError('Keyvault secret not found');
        const result = connectionstringToDetails(keyvault_secret);
        const config: ConfigOracleSqlManagement = { host: result.host, port: result.port, database: result.database, user: result.user, password: null };
        object.config = config;
        break;
      }
      default:
        break;
    }
    return object;
  }

  async createLinkedService(type: LinkedServiceType, config: object): Promise<LinkedService> {
    let config_db;
    const linkedservice_id = uuidv4().toUpperCase();
    switch (type) {
      case LinkedServiceType.ORACLESQL: {
        const config_parsed_new = config_oraclesql_management_schema.safeParse(config);
        if (!config_parsed_new.success) throw new CustomError(`Error in parsing Linked Service config 4: ${JSON.stringify(config_parsed_new.error)}`);
        const config_data = config_parsed_new.data;
        const kv_name = `dataplatform-ls-${linkedservice_id}`;
        const connectionstring = `Host=${config_data.host};Port=${config_data.port};ServiceName=${config_data.database};User Id=${config_data.user};Password={${config_data.password}};`;
        const keyvault_check = await this.keyvault_service.getSecretValue(kv_name);
        if (keyvault_check) throw new CustomError('Keyvault secret already exists');
        const keyvault_sercet = await this.keyvault_service.setSecret(kv_name, connectionstring);
        if (!keyvault_sercet) throw new CustomError('Error while creating keyvault secret');
        config_db = { connectionstring_azurekeyvaultsecret_name: kv_name };
        if (!config_db) throw new CustomError('Error while creating linked service and parsing config');
        const linkedservice = await this.linkedservice_entity_service.createLinkedService(linkedservice_id, type, config_db);
        config_data.password = null;
        linkedservice.config = config_data;
        return linkedservice;
      }
      default:
        break;
    }
    throw new CustomError('Error while creating linked service');
  }

  async updateLinkedService(linkedservice_id: string, state: LinkedServiceState, type: LinkedServiceType, config: object): Promise<LinkedService> {
    const linkedservice_existing = await this.linkedservice_entity_service.getLinkedServiceById(linkedservice_id);
    if (!linkedservice_existing) throw new CustomError('Linked service not found');
    switch (type) {
      case LinkedServiceType.ORACLESQL: {
        const config_parsed_new = config_oraclesql_management_schema.safeParse(config);
        const config_parsed_existing = config_oraclesql_schema.safeParse(linkedservice_existing.config);
        if (!config_parsed_new.success) throw new CustomError(`Error in parsing Linked Service config 5: ${JSON.stringify(config_parsed_new.error)}`);
        if (!config_parsed_existing.success) throw new CustomError(`Error in parsing Linked Service config 5.1: ${JSON.stringify(config_parsed_existing.error)}`);
        const config_data_new = config_parsed_new.data;
        const config_data_existing = config_parsed_existing.data;
        const connectionstring = `Host=${config_data_new.host};Port=${config_data_new.port};ServiceName=${config_data_new.database};User Id=${config_data_new.user};Password=${config_data_new.password};`;
        const keyvault_sercet = await this.keyvault_service.setSecret(config_data_existing.connectionstring_azurekeyvaultsecret_name, connectionstring);
        if (!keyvault_sercet) throw new CustomError('Error while updating keyvault secret');
        const linkedservice_updated = await this.linkedservice_entity_service.updateLinkedService(linkedservice_id, state, type);
        config_data_new.password = null;
        linkedservice_updated.config = config_data_new;
        return linkedservice_updated;
      }
      default:
        break;
    }
    throw new CustomError('Error while updating linked service');
  }

  async updateLinkedServiceState(linkedservice_id: string, state: LinkedServiceState) {
    return await this.linkedservice_entity_service.updateLinkedServiceState(linkedservice_id, state);
  }

  async deleteLinkedService(linkedservice_id: string): Promise<LinkedService | undefined> {
    const linkedservice = await this.getLinkedServiceById(linkedservice_id);
    if (!linkedservice) throw new CustomError('Linked service not found');
    const pipelines = await this.pipeline_entity_service.getPipelines();
    for (const pipeline of pipelines) {
      if (pipeline.linkedservice_id === linkedservice_id) throw new CustomError('Linked Service is in use');
    }
    return await this.linkedservice_entity_service.deleteLinkedService(linkedservice_id);
  }

  async testConnectionstring(linkedservice_id: string) {
    const linkedservice = await this.linkedservice_entity_service.getLinkedServiceById(linkedservice_id);
    if (linkedservice) {
      const config_parsed = config_oraclesql_schema.safeParse(linkedservice.config);
      if (config_parsed.success) {
        await this.updateLinkedServiceState(linkedservice.linkedservice_id, LinkedServiceState.VALIDATING);
        const check = await this.azuresynapse_service.testConnectionString(config_parsed.data.connectionstring_azurekeyvaultsecret_name);
        if (check) {
          await this.updateLinkedServiceState(linkedservice.linkedservice_id, LinkedServiceState.CONNECTED);
        } else {
          await this.updateLinkedServiceState(linkedservice.linkedservice_id, LinkedServiceState.FAILED);
        }
      } else {
        console.log(`While testing connectionstring, error in parsing config: ${JSON.stringify(config_parsed.error)}`);
      }
    }
  }
  async testQuery(linkedservice_id: string) {
    const linkedservice = await this.linkedservice_entity_service.getLinkedServiceById(linkedservice_id);
    if (linkedservice) {
      const config_parsed = config_oraclesql_schema.safeParse(linkedservice.config);
      if (config_parsed.success) {
        return await this.azuresynapse_service.testQuery(
          config_parsed.data.connectionstring_azurekeyvaultsecret_name,
          `SELECT
    C.OWNER AS SCHEMA_NAME,
    C.TABLE_NAME,
    C.COLUMN_NAME,
    C.DATA_TYPE,
    CASE O.OBJECT_TYPE
        WHEN 'MATERIALIZED VIEW' THEN 'VIEW'
        ELSE O.OBJECT_TYPE
    END OBJECT_TYPE
FROM
    SYS.ALL_TAB_COLUMNS C
    JOIN SYS.ALL_OBJECTS O ON C.OWNER = O.OWNER
    AND C.TABLE_NAME = O.OBJECT_NAME
    JOIN SYS.USER_TAB_PRIVS U ON C.OWNER = U.OWNER
    AND C.TABLE_NAME = U.TABLE_NAME
WHERE
    O.OBJECT_TYPE IN ('VIEW', 'TABLE', 'MATERIALIZED VIEW')
    AND U.PRIVILEGE = 'READ'
    AND U.GRANTEE = USER
ORDER BY
    C.OWNER,
    C.TABLE_NAME,
    C.COLUMN_ID;`,
        );
      } else {
        console.log(`While testing connectionstring, error in parsing config: ${JSON.stringify(config_parsed.error)}`);
      }
    }
    return undefined;
  }
}
