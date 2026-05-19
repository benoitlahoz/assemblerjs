import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import {
  Body as FetchBody,
  Fetch,
  Parse,
  type FetchStatus,
} from '@assemblerjs/fetch';

@Assemblage()
export class DtoE2EClient implements AbstractAssemblage {
  public baseUrl = '';

  @Fetch('post', (target: DtoE2EClient) => `${target.baseUrl}/dto-e2e/validate`, {
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
  })
  @Parse('json')
  async validate(
    @FetchBody() body: string,
    data?: any,
    error?: Error,
    status?: FetchStatus
  ) {
    return { data, error, status };
  }

  @Fetch('post', (target: DtoE2EClient) => `${target.baseUrl}/dto-e2e/adapt`, {
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
  })
  @Parse('json')
  async adapt(
    @FetchBody() body: string,
    data?: any,
    error?: Error,
    status?: FetchStatus
  ) {
    return { data, error, status };
  }

  @Fetch('post', (target: DtoE2EClient) => `${target.baseUrl}/dto-e2e/safe`, {
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
  })
  @Parse('json')
  async safe(
    @FetchBody() body: string,
    data?: any,
    error?: Error,
    status?: FetchStatus
  ) {
    return { data, error, status };
  }

  @Fetch('get', (target: DtoE2EClient) => `${target.baseUrl}/dto-e2e/metadata`)
  @Parse('json')
  async metadata(data?: any, error?: Error, status?: FetchStatus) {
    return { data, error, status };
  }

  @Fetch('get', (target: DtoE2EClient) => `${target.baseUrl}/dto-e2e/schema`)
  @Parse('json')
  async schema(data?: any, error?: Error, status?: FetchStatus) {
    return { data, error, status };
  }
}
