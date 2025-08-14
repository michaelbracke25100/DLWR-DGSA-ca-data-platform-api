import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { sha1 } from 'object-hash';
import { ValueTransformer } from 'typeorm';
import { type FastifyInstance, FastifyRequest } from 'fastify';
import { UserType } from '../schemas/user';
import { getConfig } from '../config/config';

export class CustomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomError';
  }
}

const axios_instance = axios.create();

axios_instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError): Promise<void> => {
    console.error('Error:', error.message);
    throw new CustomError(error.message);
  },
);

export function JSONcompress(json: object): string {
  const jsonString = encodeURIComponent(JSON.stringify(json));
  return btoa(jsonString);
}

// * A function that hashes the json parameters to a unique hash for comparison later on.
export function JSONToHash(json: object): string {
  const compressed = JSONcompress(json);
  const hashed = sha1(compressed);
  return hashed;
}

export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number | null {
    if (data) return parseInt(data);
    return null;
  }
}

export class JsonTransformer implements ValueTransformer {
  to(value: object): string {
    return JSON.stringify(value);
  }

  from(value: string): object {
    const parsed: object = JSON.parse(value);
    return parsed;
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// * Function to make a GET request
export async function axios_request_get(url: string, headers?: AxiosRequestConfig['headers'], params?: AxiosRequestConfig['params']): Promise<AxiosResponse> {
  return await axios_instance.get(url, {
    validateStatus: () => true,
    headers,
    params,
  });
}

// * Function to make a PUT request
export async function axios_request_put(url: string, headers: AxiosRequestConfig['headers'], body: unknown): Promise<AxiosResponse> {
  return await axios_instance.put(url, body, {
    validateStatus: () => true,
    headers,
  });
}

// * Function to make a POST request
export async function axios_request_post(url: string, headers: AxiosRequestConfig['headers'], body: unknown): Promise<AxiosResponse> {
  return await axios_instance.post(url, body, {
    validateStatus: () => true,
    headers,
  });
}

// * Function to make a DELETE request
export async function axios_request_delete(url: string, headers?: AxiosRequestConfig['headers']): Promise<AxiosResponse> {
  return await axios_instance.delete(url, {
    validateStatus: () => true,
    headers,
  });
}

export function connectionstringToDetails(connectionstring: string) {
  const parts = connectionstring.split(';');
  const configData = {
    host: '',
    port: 0,
    database: '',
    user: '',
  };
  parts.forEach(part => {
    const [key, value] = part.split('=').map(s => s.trim());
    switch (key) {
      case 'Data Source': {
        const [host, port] = value.split(',');
        configData.host = host;
        configData.port = parseInt(port);
        break;
      }
      case 'Host': {
        const [host, port] = value.split(',');
        configData.host = host;
        configData.port = parseInt(port);
        break;
      }
      case 'Port': {
        configData.port = parseInt(value);
        break;
      }
      case 'Initial Catalog':
        configData.database = value;
        break;
      case 'ServiceName':
        configData.database = value;
        break;
      case 'User Id':
        configData.user = value;
        break;
    }
  });
  return configData;
}

export function FilterObjectByUserGroup<T extends { user_groups: string | string[] | null }>(resultLines: T[], headerUserGroups: string[] | undefined): T[] {
  if (!headerUserGroups) {
    return [];
  }
  const isAdmin = headerUserGroups.some(group => group.toLowerCase() === 'admin_dataplatform');

  if (isAdmin) {
    return resultLines;
  }

  return resultLines.filter(line => {
    if (line.user_groups === null) {
      return false;
    }
    const userGroupsArray = Array.isArray(line.user_groups) ? line.user_groups : [line.user_groups];
    return userGroupsArray.some(group => headerUserGroups.includes(group));
  });
}

export function SetUserData(req: FastifyRequest, server: FastifyInstance): void {
  const userData: UserType = {
    user_id: req.headers['user_id'] as string,
    user_groups: req.headers['user_groups'] ? JSON.parse(req.headers['user_groups'] as string) : [],
  };
  server.user = userData;
}

