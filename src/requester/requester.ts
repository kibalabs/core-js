/// <reference lib="dom" />
import { KibaRequest } from './request';
import { KibaResponse } from './response';
import { RestMethod } from './restMethod';
import { KibaException } from '../model/kibaException';
import { timeoutPromise } from '../util/promiseUtil';
import { createSearchParams } from '../util/urlUtils';

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
  };

  private modifyRequest = (request: KibaRequest): KibaRequest => {
    return this.modifiers.reduce((currentRequest: KibaRequest, modifier: RequesterModifier): KibaRequest => {
      return modifier.modifyRequest(currentRequest);
    }, request);
  };

  private modifyResponse = (response: KibaResponse): KibaResponse => {
    return this.modifiers.reduce((currentResponse: KibaResponse, modifier: RequesterModifier): KibaResponse => {
      return modifier.modifyResponse(currentResponse);
    }, response);
  };

  public getRequest = async (url: string, data?: Record<string, unknown>, headers?: Record<string, string>, timeout?: number): Promise<KibaResponse> => {
    const request = new KibaRequest(RestMethod.GET, url, headers, data, undefined, new Date(), timeout);
    return this.makeRequestInternal(request);
  };

  public postRequest = async (url: string, data?: Record<string, unknown>, headers?: Record<string, string>, timeout?: number): Promise<KibaResponse> => {
    const request = new KibaRequest(RestMethod.POST, url, headers, data, undefined, new Date(), timeout);
    return this.makeRequestInternal(request);
  };

  public putRequest = async (url: string, data?: Record<string, unknown>, headers?: Record<string, string>, timeout?: number): Promise<KibaResponse> => {
    const request = new KibaRequest(RestMethod.PUT, url, headers, data, undefined, new Date(), timeout);
    return this.makeRequestInternal(request);
  };

  public deleteRequest = async (url: string, data?: Record<string, unknown>, headers?: Record<string, string>, timeout?: number): Promise<KibaResponse> => {
    const request = new KibaRequest(RestMethod.DELETE, url, headers, data, undefined, new Date(), timeout);
    return this.makeRequestInternal(request);
  };

  public makeRequest = async (method: RestMethod, url: string, data?: Record<string, unknown>, headers?: Record<string, string>, timeout?: number): Promise<KibaResponse> => {
    const request = new KibaRequest(method, url, headers, data, undefined, new Date(), timeout);
    return this.makeRequestInternal(request);
  };

  public makeFormRequest = async (url: string, data?: FormData, headers?: Record<string, string>, timeout?: number): Promise<KibaResponse> => {
    const request = new KibaRequest(RestMethod.POST, url, headers, undefined, data, new Date(), timeout);
    return this.makeRequestInternal(request);
  };

  public makeFormPutRequest = async (url: string, data?: FormData, headers?: Record<string, string>, timeout?: number): Promise<KibaResponse> => {
    const request = new KibaRequest(RestMethod.PUT, url, headers, undefined, data, new Date(), timeout);
    return this.makeRequestInternal(request);
  };

  public makeStreamingRequest = async <StreamItemType>(
    method: RestMethod,
    url: string,
    data: Record<string, unknown> | undefined,
    parseItem: (obj: Record<string, unknown>) => StreamItemType,
    onItem: (item: StreamItemType) => void,
    headers?: Record<string, string>,
    timeout?: number,
  ): Promise<void> => {
    const request = new KibaRequest(method, url, headers, data, undefined, new Date(), timeout);
    await this.makeStreamingRequestInternal(request, parseItem, onItem);
  };

  private makeRequestInternal = async (request: KibaRequest): Promise<KibaResponse> => {
    const modifiedRequest = this.modifyRequest(request);
    let response = await this.makeFetchRequest(modifiedRequest);
    response = this.modifyResponse(response);
    if (response.status >= 400 && response.status < 600) {
      Requester.throwKibaExceptionFromErrorContent(response.content, response.status);
    }
    return response;
  };

  private makeStreamingRequestInternal = async <StreamItemType>(
    request: KibaRequest,
    parseItem: (obj: Record<string, unknown>) => StreamItemType,
    onItem: (item: StreamItemType) => void,
  ): Promise<void> => {
    const modifiedRequest = this.modifyRequest(request);
    const response = await this.makeStreamingFetchRequest(modifiedRequest, parseItem, onItem);
    this.modifyResponse(response);
  };

  private createFetchRequestConfig = (request: KibaRequest): { url: URL; fetchConfig: { method: string; headers: Headers; credentials: 'include' | 'same-origin'; body?: string | FormData } } => {
    const url = new URL(request.url);
    const headers = new Headers({ ...this.headers, ...(request.headers || {}) });
    // NOTE(krishan711): RequestInit comes from the DOM which isn't used by default in typescript typings
    const fetchConfig: { method: string; headers: Headers; credentials: 'include' | 'same-origin'; body?: string | FormData } = {
      method: request.method.toUpperCase(),
      headers,
      credentials: this.shouldIncludeCrossSiteCredentials ? 'include' : 'same-origin',
    };
    if (request.method === RestMethod.GET || request.method === RestMethod.DELETE) {
      if (request.data) {
        const requestData = ({ ...request.data }) as Record<string, string>;
        Object.keys(requestData).forEach((key: string): void => {
          if (requestData[key] === undefined) {
            delete requestData[key];
          }
        });
        url.search = createSearchParams(requestData).toString();
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
        // NOTE(krishan711): I don't know whether this should be set or not.
        // For S3 uploads it cannot be set as the file type is set already
        // For azure uploads the content-type should be set by the caller to the file type
        // headers.set('content-type', 'multipart/form-data');
      }
    }
    return { url, fetchConfig };
  };

  private static getResponseHeaders = (response: Response): Record<string, string> => {
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value: string, key: string): void => {
      if (responseHeaders[key]) {
        console.warn(`key ${key} will be overwritten. TODO(krish): Implement joining keys!`);
      }
      responseHeaders[key] = value;
    });
    return responseHeaders;
  };

  private static throwKibaExceptionFromErrorContent = (errorContent: string, statusCode: number): never => {
    let parsedErrorContent: Record<string, unknown> | null = null;
    try {
      parsedErrorContent = JSON.parse(errorContent) as Record<string, unknown>;
    } catch {
      // no-op
    }
    if (parsedErrorContent && 'message' in parsedErrorContent) {
      const fields = parsedErrorContent.fields as Record<string, string> || {};
      const exceptionType = typeof parsedErrorContent.exceptionType === 'string' ? parsedErrorContent.exceptionType : undefined;
      throw new KibaException(String(parsedErrorContent.message), statusCode, exceptionType, fields);
    }
    throw new KibaException(errorContent, statusCode, undefined, {});
  };

  private makeFetchRequest = async (request: KibaRequest): Promise<KibaResponse> => {
    const { url, fetchConfig } = this.createFetchRequestConfig(request);
    const fetchOperation = fetch(url.toString(), fetchConfig)
      .catch((error): void => {
        throw new KibaException(`The request was made but no response was received: [${error.code}] "${error.message}"`);
      })
      .then(async (response: Response | void): Promise<KibaResponse> => {
        if (!response) {
          throw new KibaException('The request was made but no response was received.');
        }
        const content = await response.text();
        return new KibaResponse(response.status, Requester.getResponseHeaders(response), new Date(), content);
      });
    const response = await (request.timeoutSeconds ? timeoutPromise(request.timeoutSeconds, fetchOperation) : fetchOperation);
    return response;
  };

  private makeStreamingFetchRequest = async <StreamItemType>(
    request: KibaRequest,
    parseItem: (obj: Record<string, unknown>) => StreamItemType,
    onItem: (item: StreamItemType) => void,
  ): Promise<KibaResponse> => {
    const { url, fetchConfig } = this.createFetchRequestConfig(request);
    const fetchOperation = fetch(url.toString(), fetchConfig)
      .catch((error): void => {
        throw new KibaException(`The request was made but no response was received: [${error.code}] "${error.message}"`);
      })
      .then(async (response: Response | void): Promise<KibaResponse> => {
        if (!response) {
          throw new KibaException('The request was made but no response was received.');
        }
        const responseHeaders = Requester.getResponseHeaders(response);
        if (response.status >= 400 && response.status < 600) {
          const errorContent = await response.text();
          Requester.throwKibaExceptionFromErrorContent(errorContent, response.status);
        }
        const reader = response.body?.getReader();
        if (!reader) {
          throw new KibaException('The request was made but no response body was received.');
        }
        const processLine = (line: string): void => {
          const trimmedLine = line.trim();
          if (!trimmedLine) {
            return;
          }
          let itemObject: Record<string, unknown>;
          try {
            itemObject = JSON.parse(trimmedLine) as Record<string, unknown>;
          } catch (error) {
            throw new KibaException(`Failed to parse streaming response line: ${trimmedLine}. Error: ${String(error)}`);
          }
          onItem(parseItem(itemObject));
        };

        const decoder = new TextDecoder();
        let buffer = '';
        const readAllChunks = async (): Promise<void> => {
          const { done, value } = await reader.read();
          if (done) {
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(processLine);
          await readAllChunks();
        };
        await readAllChunks();
        buffer += decoder.decode();
        processLine(buffer);

        return new KibaResponse(response.status, responseHeaders, new Date(), '');
      });
    const response = await (request.timeoutSeconds ? timeoutPromise(request.timeoutSeconds, fetchOperation) : fetchOperation);
    return response;
  };
}
