import {synapse_test_request_parameters_schema} from '../schemas/synapse';
import {AzureSynapseService} from '../services/AzureSynapseService';
import {sleep} from '../utilities/utils';

export interface IAzureSynapseController {
  testConnectionString(oracle_connectionstring_kv_name: string): Promise<boolean | undefined>;
}

export class AzureSynapseController implements IAzureSynapseController {
  private azuresynapse_service: AzureSynapseService;
  private synapse_pipeline_name: string;

  constructor(azuresynapse_service: AzureSynapseService, synapse_pipeline_name: string) {
    this.azuresynapse_service = azuresynapse_service;
    this.synapse_pipeline_name = synapse_pipeline_name;
  }

  async testConnectionString(oracle_connectionstring_kv_name: string): Promise<boolean | undefined> {
    return this.azuresynapse_service.testConnectionString(oracle_connectionstring_kv_name);
  }

  async testQuery(oracle_connectionstring_kv_name: string, query: string) {
    const test_parameters: synapse_test_request_parameters_schema = {oracle_connectionstring_kv_name, query};
    const trigger_response = await this.azuresynapse_service.triggerSynapsePipeline(test_parameters, this.synapse_pipeline_name);

    const run_id_synapse: string = trigger_response.runId;
    let run_status_synapse = await this.azuresynapse_service.getPipelineRunStatus(run_id_synapse);
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
      run_status_synapse = await this.azuresynapse_service.getPipelineRunStatus(run_id_synapse);
    }
    console.log(`Synapse pipeline (test) status: ${run_status_synapse.status}`);
    console.log(`Synapse pipeline (test) message: ${JSON.stringify(run_status_synapse.pipelineReturnValue)}`);
    if (run_status_synapse.status == 'Succeeded') return run_status_synapse.pipelineReturnValue;
    if (run_status_synapse.status == 'Failed') return run_status_synapse.pipelineReturnValue;
    return undefined;
  }
}
