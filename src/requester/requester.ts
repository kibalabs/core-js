/* eslint-disable max-classes-per-file */
import { KibaException } from '../model/kibaException';
import { timeoutPromise } from '../util/promiseUtil';
import { KibaRequest } from './request';
import { KibaResponse } from './response';
import { RestMethod } from './restMethod';

export class RequesterModifier {
  // eslint-disable-next-line class-methods-use-this
  public modifyRequest(request: KibaRequest): KibaRequest {
    return request;
  }

  // eslint-disable-next-line class-methods-use-this
  public modifyResponse(response: KibaResponse): KibaResponse {
    return response;
  }
}

export class Requester {
  private headers: Record<string, string>;
  private modifiers: RequesterModifier[];

  public constructor(headers?: Record<string, string>, modifiers?: RequesterModifier[]) {
    this.headers = headers || {};
    this.modifiers = modifiers || [];
  }

  public addModifier = (modifier: RequesterModifier): void => {
    this.modifiers.push(modifier);
  }

  private modifyRequest = (request: KibaRequest): KibaRequest => {
    return this.modifiers.reduce((currentRequest: KibaRequest, modifier: RequesterModifier): KibaRequest => {
      return modifier.modifyRequest(currentRequest);
    }, request);
  }

  private modifyResponse = (response: KibaResponse): KibaResponse => {
    return this.modifiers.reduce((currentResponse: KibaResponse, modifier: RequesterModifier): KibaResponse => {
      return modifier.modifyResponse(currentResponse);
    }, response);
  }

  public makeRequest = async (method: RestMethod, url: string, data?: Record<string, unknown>, headers?: Record<string, string>, timeout?: number): Promise<KibaResponse> => {
    const request = new KibaRequest(method, url, headers, data, undefined, new Date(), timeout);
    return this.makeRequestInternal(request);
  }

  public makeFormRequest = async (url: string, data?: FormData, headers?: Record<string, string>, timeout?: number): Promise<KibaResponse> => {
    const request = new KibaRequest(RestMethod.POST, url, headers, null, data, new Date(), timeout);
    return this.makeRequestInternal(request);
  }

  private makeRequestInternal = async (request: KibaRequest): Promise<KibaResponse> => {
    const modifiedRequest = this.modifyRequest(request);
    let response = await this.makeFetchRequest(modifiedRequest);
    response = this.modifyResponse(response);
    if (response.status >= 400 && response.status < 600) {
      let errorContent = null;
      try {
        errorContent = JSON.parse(response.content);
      } catch {
        // no-op
      }
      if (errorContent && 'message' in errorContent) {
        throw new KibaException(errorContent.message, response.status);
      }
      throw new KibaException(response.content, response.status);
    }
    return response;
  }

  private makeFetchRequest = async (request: KibaRequest): Promise<KibaResponse> => {
    const url = new URL(request.url);
    // NOTE(krishan711): RequestInit comes from the DOM which isn't used be default in typescript typings
    // eslint-disable-next-line no-undef
    const fetchConfig: RequestInit = {
      method: request.method.toUpperCase(),
      headers: { ...this.headers, ...(request.headers || {}) },
    };
    if (request.method === RestMethod.GET || request.method === RestMethod.DELETE) {
      if (request.data) {
        url.search = new URLSearchParams(request.data).toString();
      }
    } else {
      fetchConfig.body = request.data ? JSON.stringify(request.data) : request.formData;
    }
    const fetchOperation = window.fetch(url.toString(), fetchConfig)
      .catch((error): void => {
        throw new KibaException(`The request was made but no response was received: [${error.code}] "${error.message}"`);
      })
      .then(async (response: Response): Promise<KibaResponse> => {
        const content = await response.text();
        const headers: Record<string, string> = {};
        response.headers.forEach((value: string, key: string): void => {
          if (headers[key]) {
            console.warn(`key ${key} will be overwritten. TODO(krish): Implement joining keys!`);
          }
          headers[key] = value;
        });
        return new KibaResponse(response.status, headers, new Date(), content);
      });
    const response = await (request.timeoutSeconds ? timeoutPromise(request.timeoutSeconds, fetchOperation) : fetchOperation);
    return response;
  }

  // public makeAxiosRequest = async (request: KibaRequest): Promise<KibaResponse> => {
  //   const axiosRequest: AxiosRequestConfig = {
  //     method: request.method,
  //     url: request.url,
  //     data: request.data,
  //     headers: {...this.headers, ...(request.headers || {})},
  //     timeout: request.timeoutSeconds ? request.timeoutSeconds * 1000 : undefined,
  //   };
  //   let axiosResponse = null;
  //   try {
  //     axiosResponse = await axios(axiosRequest)
  //   } catch (error) {
  //     axiosResponse = error.response;
  //     if (!axiosResponse && error.request) {
  //       throw new KibaException(`The request was made but no response was received: [${error.code}] "${error.message}"`);
  //     }
  //   }
  //   const response = new KibaResponse(axiosResponse.status, axiosResponse.headers, new Date(), JSON.stringify(axiosResponse.data));
  //   return response;
  // }
}
