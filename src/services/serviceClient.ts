/* eslint-disable max-classes-per-file */
import { Requester, RestMethod } from '../requester';

// TODO(krishan711): should this be an interface?
export class RequestData {
  public toObject = (): Record<string, unknown> => {
    return {};
  }
}

// TODO(krishan711): should this be an interface?
export class ResponseData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static fromObject = <T extends ResponseData>(obj: Record<string, unknown>): T => {
    throw new Error();
  }
}

export class ServiceClient {
  protected requester: Requester;
  protected baseUrl: string;

  public constructor(requester: Requester, baseUrl: string) {
    this.requester = requester;
    this.baseUrl = baseUrl;
  }

  protected makeRequest = async <ResponseType extends ResponseData>(method: RestMethod, path: string, request?: RequestData, responseClass?: ResponseType): Promise<ResponseType> => {
    const url = `${this.baseUrl}/${path}`;
    const response = await this.requester.makeRequest(method, url, request?.toObject());
    // @ts-ignore
    return responseClass ? responseClass.fromObject(JSON.parse(response.content)) : null;
  }
}
