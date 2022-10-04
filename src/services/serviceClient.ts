import { Requester, RestMethod } from '../requester';

// TODO(krishan711): should this be an interface?
export class RequestData {
  // eslint-disable-next-line class-methods-use-this
  public toObject = (): Record<string, unknown> => {
    return {};
  };
}

// TODO(krishan711): should this be an interface?
export class ResponseData {
  // public static fromObject = <T extends ResponseData>(obj: Record<string, unknown>): T => {
  //   throw new Error();
  // }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = Record<string, unknown>> = new (...args: any[]) => T;

export class ServiceClient {
  protected requester: Requester;
  public baseUrl: string;

  public constructor(requester: Requester, baseUrl: string) {
    this.requester = requester;
    this.baseUrl = baseUrl;
  }

  protected makeRequest = async <ResponseType extends ResponseData>(method: RestMethod, path: string, request?: RequestData | undefined, responseClass?: Constructor<ResponseType> | undefined): Promise<ResponseType> => {
    const url = `${this.baseUrl}/${path}`;
    const response = await this.requester.makeRequest(method, url, request?.toObject());
    // @ts-ignore
    return responseClass ? responseClass.fromObject(JSON.parse(response.content)) : null;
  };
}
