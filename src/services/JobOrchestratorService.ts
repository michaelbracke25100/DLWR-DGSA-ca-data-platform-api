import {JobRun} from '../schemas/job_run.entity';
import {JobRunOutput} from '../schemas/job_run_output.entity';
import {JobRunResult} from '../schemas/job_run_result.entity';
import {axios_request_get, axios_request_post} from '../utilities/utils';

class JobOrchestratorService {
  private ca_joborchestrator_url: string;
  private token: string;

  constructor(ca_joborchestrator_url: string, token: string) {
    this.ca_joborchestrator_url = ca_joborchestrator_url;
    this.token = token;
  }

  //TODO Add Authorization header (new App Registration?)
  async createJobRun(job_id: string, job_parameters: object): Promise<{run_id: string} | undefined> {
    const result = await axios_request_post(`${this.ca_joborchestrator_url}/api/jobs/${job_id}/runs`, {Authorization: `Bearer ${this.token}`}, job_parameters);
    if (result.status >= 300) {
      console.error(`Job Orchestrator call failed (${result.status}): ${JSON.stringify(result.data)}`);
      return undefined;
    }
    const data: {run_id: string} = result.data;
    return data;
  }

  //TODO Add Authorization header (new App Registration?)
  async getJobById(job_id: string): Promise<JobRun[] | undefined> {
    const result = await axios_request_get(`${this.ca_joborchestrator_url}/api/jobs/${job_id}`, {Authorization: `Bearer ${this.token}`});
    if (result.status >= 300) {
      console.error(`Job Orchestrator call failed (${result.status}): ${JSON.stringify(result.data)}`);
      return undefined;
    }
    const data: JobRun[] | undefined = result.data;
    return data;
  }

  //TODO Add Authorization header (new App Registration?)
  async getJobRunById(job_id: string, run_id: string): Promise<JobRunResult | undefined> {
    const result = await axios_request_get(`${this.ca_joborchestrator_url}/api/jobs/${job_id}/runs/${run_id}`, {Authorization: `Bearer ${this.token}`});
    if (result.status >= 300 && result.status != 500) {
      console.error(`Job Orchestrator call failed (${result.status}): ${JSON.stringify(result.data)}`);
      return undefined;
    }
    const data: JobRunResult | undefined = result.data;
    return data;
  }

  //TODO Add Authorization header (new App Registration?)
  async getJobRunOutputByRunId(job_id: string, run_id: string): Promise<JobRunOutput | undefined> {
    const result = await axios_request_get(`${this.ca_joborchestrator_url}/api/jobs/${job_id}/runs/${run_id}/result`, {Authorization: `Bearer ${this.token}`}, {binary_download: true});
    if (result.status >= 300) {
      console.error(`Job Orchestrator call failed (${result.status}): ${JSON.stringify(result.data)}`);
      return undefined;
    }
    const data: JobRunOutput | undefined = result.data;
    return data;
  }
}
export default JobOrchestratorService;
