import axios from 'axios';
import {DefaultAzureCredential} from '@azure/identity';
import {
  synapse_pipeline_createrun_response,
  synapse_pipeline_createrun_response_scheme,
  synapse_pipeline_get_pipelineruns_response,
  synapse_pipeline_get_pipelineruns_response_scheme,
  synapse_pipeline_get_pipelinerunslogs_response,
  synapse_pipeline_get_pipelinerunslogs_response_scheme,
  synapse_pipeline_get_pipelines_response,
  synapse_pipeline_get_pipelines_response_scheme,
  synapse_pipeline_request_parameters,
  synapse_pipeline_stop_pipelineruns_response,
  synapse_pipeline_stop_pipelineruns_response_scheme,
  synapse_test_request_parameters_schema,
} from '../schemas/synapse';
import {CustomError, sleep} from '../utilities/utils';

export interface IAzureSynapseService {
  triggerSynapsePipeline(body: synapse_pipeline_request_parameters): Promise<synapse_pipeline_createrun_response>;
  stopPipelineRun(run_id: string): Promise<synapse_pipeline_stop_pipelineruns_response>;
  getPipelineRunStatus(run_id: string): Promise<synapse_pipeline_get_pipelineruns_response>;
  getPipelineRunLogs(run_id: string): Promise<synapse_pipeline_get_pipelinerunslogs_response>;
  getPipelines(): Promise<synapse_pipeline_get_pipelines_response>;
}

export class AzureSynapseService implements IAzureSynapseService {
  private id_clientid: string;
  private synapse_endpoint: string;
  private synapse_pipeline_testoracle_name: string;

  constructor(synapse_endpoint: string, id_clientid: string, synapse_pipeline_testoracle_name: string) {
    this.synapse_endpoint = synapse_endpoint;
    this.id_clientid = id_clientid;
    this.synapse_pipeline_testoracle_name = synapse_pipeline_testoracle_name;
  }

  /**
   * Retrieves an access token for Azure Synapse using the provided credentials.
   * @returns {Promise<string>} The access token.
   * @throws Will throw an error if the token cannot be obtained.
   */
  private async getAccessToken(): Promise<string> {
    const default_azure_credential = new DefaultAzureCredential({
      managedIdentityClientId: this.id_clientid,
    });
    const tokenResponse = await default_azure_credential.getToken('https://dev.azuresynapse.net/');
    const accessToken = tokenResponse?.token;

    if (!accessToken) {
      throw new CustomError('Failed to obtain access token');
    }

    return accessToken;
  }

  /**
   * Triggers a new run of a Synapse pipeline.
   * @param {synapse_pipeline_request} body - The request body containing pipeline parameters.
   * @returns {Promise<synapse_pipeline_createrun_response>} The response from the pipeline creation.
   * @throws Will throw an error if the pipeline trigger fails.
   */
  async triggerSynapsePipeline(body: object, synapse_pipeline_name?: string): Promise<synapse_pipeline_createrun_response> {
    try {
      const url = `${this.synapse_endpoint}/pipelines/${synapse_pipeline_name}/createRun?api-version=2020-12-01`;

      const response = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status <= 305) {
        return synapse_pipeline_createrun_response_scheme.parse(response.data);
      } else throw Error(`Synapse trigger failed. reason: ${response.statusText}`);
    } catch (error) {
      console.log('Synapse trigger failed. reason:', error);
      throw error;
    }
  }

  /**
   * Stops a running Synapse pipeline.
   * @param {string} run_id - The ID of the pipeline run to stop.
   * @returns {Promise<synapse_pipeline_stop_pipelineruns_response>} The response from the stop request.
   * @throws Will throw an error if stopping the pipeline run fails.
   */
  async stopPipelineRun(run_id: string): Promise<synapse_pipeline_stop_pipelineruns_response> {
    try {
      const url = `${this.synapse_endpoint}/pipelineruns/${run_id}/cancel?api-version=2020-12-01`;
      const response = await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${await this.getAccessToken()}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status <= 305) {
        return synapse_pipeline_stop_pipelineruns_response_scheme.parse(response.data);
      } else throw Error(`Synapse triggerstop failed. reason: ${response.statusText}`);
    } catch (error) {
      console.error('Error stopping pipeline run:', error);
      throw error;
    }
  }

  /**
   * Retrieves the status of a specific Synapse pipeline run.
   * @param {string} run_id - The ID of the synapse pipeline run.
   * @returns {Promise<synapse_pipeline_get_pipelineruns_response>} The status of the pipeline run.
   * @throws Will throw an error if retrieving the pipeline run status fails.
   */
  async getPipelineRunStatus(run_id: string): Promise<synapse_pipeline_get_pipelineruns_response> {
    try {
      const url = `${this.synapse_endpoint}/pipelineruns/${run_id}?api-version=2020-12-01`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status <= 305) {
        console.log(`Status from synpase: ${JSON.stringify(response.statusText)}`);
        return synapse_pipeline_get_pipelineruns_response_scheme.parse(response.data);
      } else throw Error(`Pipeline run status retrieval failed. reason: ${response.statusText}`);
    } catch (error) {
      console.error('Error retrieving pipeline run status:', error);
      throw error;
    }
  }

  /**
   * Retrieves the logs of a specific Synapse pipeline run.
   * @param {string} run_id - The ID of the pipeline run.
   * @returns {Promise<synapse_pipeline_get_pipelinerunslogs_response>} The logs of the pipeline run.
   * @throws Will throw an error if retrieving the pipeline run logs fails.
   */
  async getPipelineRunLogs(run_id: string): Promise<synapse_pipeline_get_pipelinerunslogs_response> {
    try {
      const url = `${this.synapse_endpoint}/pipelineruns/${run_id}/activityruns?api-version=2020-12-01`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status <= 305) {
        return synapse_pipeline_get_pipelinerunslogs_response_scheme.parse(response.data);
      } else throw Error(`Pipeline run logs retrieval failed. reason: ${response.statusText}`);
    } catch (error) {
      console.error('Error retrieving pipeline run logs:', error);
      throw error;
    }
  }

  /**
   * Retrieves pipelines from the Synapse workspace.
   * @returns {Promise<synapse_pipeline_get_pipelines_response>} All the pipelines in the synapse workspace.
   * @throws Will throw an error if retrieving the pipelines fails.
   */
  async getPipelines(): Promise<synapse_pipeline_get_pipelines_response> {
    try {
      const url = `${this.synapse_endpoint}/pipelines?api-version=2020-12-01`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status <= 305) {
        return synapse_pipeline_get_pipelines_response_scheme.parse(response.data);
      } else throw Error(`Pipelines retrieval failed. reason: ${response.statusText}`);
    } catch (error) {
      console.error('Error retrieving pipelines:', error);
      throw error;
    }
  }

  async testConnectionString(oracle_connectionstring_kv_name: string): Promise<boolean | undefined> {
    const test_parameters: synapse_test_request_parameters_schema = {oracle_connectionstring_kv_name, query: 'SELECT 1 AS TestColumn FROM dual;'};
    const trigger_response = await this.triggerSynapsePipeline(test_parameters, this.synapse_pipeline_testoracle_name);

    const run_id_synapse: string = trigger_response.runId;
    let run_status_synapse = await this.getPipelineRunStatus(run_id_synapse);
    let absolute_max_counter = 0;
    let previous_status;
    while (run_status_synapse && run_status_synapse.status !== 'Succeeded' && absolute_max_counter < 100) {
      // If the status has changed, publish a log event.
      if (run_status_synapse.status !== previous_status) {
        previous_status = run_status_synapse.status;
      }

      // If the pipeline has failed, break out of the loop.
      if (run_status_synapse.status === 'Failed') {
        break;
      }

      // Increment the counter and wait for 6 min before checking the status again.
      absolute_max_counter += 1;
      await sleep(3600);

      // Get the status of the Synapse pipeline run again.
      run_status_synapse = await this.getPipelineRunStatus(run_id_synapse);
    }
    if (run_status_synapse.status == 'Succeeded') return true;
    if (run_status_synapse.status == 'Failed') return false;
    return undefined;
  }

  async testQuery(oracle_connectionstring_kv_name: string, query: string) {
    const test_parameters: synapse_test_request_parameters_schema = {oracle_connectionstring_kv_name, query};
    const trigger_response = await this.triggerSynapsePipeline(test_parameters, this.synapse_pipeline_testoracle_name);

    const run_id_synapse: string = trigger_response.runId;
    let run_status_synapse = await this.getPipelineRunStatus(run_id_synapse);
    let absolute_max_counter = 0;
    let previous_status;
    while (run_status_synapse && run_status_synapse.status !== 'Succeeded' && absolute_max_counter < 100) {
      // If the status has changed, publish a log event.
      if (run_status_synapse.status !== previous_status) {
        previous_status = run_status_synapse.status;
        console.log(`Synapse pipline (test) status changed: ${run_status_synapse.status}`);
      }

      // If the pipeline has failed, break out of the loop.
      if (run_status_synapse.status === 'Failed') {
        return run_status_synapse.pipelineReturnValue;
      }

      // Increment the counter and wait for 6 min before checking the status again.
      absolute_max_counter += 1;
      await sleep(3600);

      // Get the status of the Synapse pipeline run again.
      run_status_synapse = await this.getPipelineRunStatus(run_id_synapse);
    }
    console.log(`Synapse pipeline (test) status: ${run_status_synapse.status}`);
    console.log(`Synapse pipeline (test) message: ${JSON.stringify(run_status_synapse.pipelineReturnValue)}`);
    if (run_status_synapse.status == 'Succeeded') return run_status_synapse.pipelineReturnValue;
    if (run_status_synapse.status == 'Failed') return run_status_synapse.pipelineReturnValue;
    return undefined;
  }
}
