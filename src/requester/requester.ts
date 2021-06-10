/// <reference lib="dom" />
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
  private shouldIncludeCrossSiteCredentials: boolean;

  public constructor(headers?: Record<string, string>, modifiers?: RequesterModifier[], shouldIncludeCrossSiteCredentials = true) {
    this.headers = headers || {};
    this.modifiers = modifiers || [];
    this.shouldIncludeCrossSiteCredentials = shouldIncludeCrossSiteCredentials;
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
    const request = new KibaRequest(RestMethod.POST, url, headers, undefined, data, new Date(), timeout);
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
    const headers = new Headers({ ...this.headers, ...(request.headers || {}) });
    // NOTE(krishan711): RequestInit comes from the DOM which isn't used by default in typescript typings
    // eslint-disable-next-line no-undef
    const fetchConfig: RequestInit = {
      method: request.method.toUpperCase(),
      headers,
      credentials: this.shouldIncludeCrossSiteCredentials ? 'include' : 'same-origin',
    };
    if (request.method === RestMethod.GET || request.method === RestMethod.DELETE) {
      if (request.data) {
        url.search = new URLSearchParams(request.data as Record<string, string>).toString();
      }
    } else {
      // TODO(krishan711): find a better place for this
      const currentContentHeader = headers.get('Content-Type');
      if (request.data) {
        fetchConfig.body = JSON.stringify(request.data);
        if (currentContentHeader && currentContentHeader !== 'application/json') {
          console.warn(`Overwriting content-type header for request from ${currentContentHeader} to application/json`);
        }
        headers.set('content-type', 'application/json');
      } else if (request.formData) {
        fetchConfig.body = request.formData;
        if (currentContentHeader && currentContentHeader !== 'multipart/form-data') {
          console.warn(`Overwriting content-type header for request from ${currentContentHeader} to multipart/form-data`);
        }
        headers.set('content-type', 'multipart/form-data');
      }
    }
    const fetchOperation = window.fetch(url.toString(), fetchConfig)
      .catch((error): void => {
        throw new KibaException(`The request was made but no response was received: [${error.code}] "${error.message}"`);
      })
      .then(async (response: Response | void): Promise<KibaResponse> => {
        if (!response) {
          throw new KibaException('The request was made but no response was received.');
        }
        const content = await response.text();
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value: string, key: string): void => {
          if (responseHeaders[key]) {
            console.warn(`key ${key} will be overwritten. TODO(krish): Implement joining keys!`);
          }
          responseHeaders[key] = value;
        });
        return new KibaResponse(response.status, responseHeaders, new Date(), content);
      });
    const response = await (request.timeoutSeconds ? timeoutPromise(request.timeoutSeconds, fetchOperation) : fetchOperation);
    return response;
  }
}
