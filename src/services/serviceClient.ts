import { Requester, RestMethod } from '../requester';

export type RawObject = Record<string, unknown>;

// TODO(krishan711): should this be an interface?
export class RequestData {
  // eslint-disable-next-line class-methods-use-this
  public toObject = (): RawObject => {
    return {};
  };
}

// TODO(krishan711): should this be an interface?
export class ResponseData {
  // public static fromObject = <T extends ResponseData>(obj: RawObject): T => {
  //   throw new Error();
  // }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = RawObject> = new (...args: any[]) => T;

export class ServiceClient {
  protected requester: Requester;
  public baseUrl: string;

  public constructor(requester: Requester, baseUrl: string) {
    this.requester = requester;
    this.baseUrl = baseUrl;
  }

  protected makeRequest = async <ResponseType extends ResponseData>(method: RestMethod, path: string, request?: RequestData | undefined, responseClass?: Constructor<ResponseType> | undefined, additionalHeaders?: Record<string, string>): Promise<ResponseType> => {
    const url = `${this.baseUrl}/${path}`;
    const response = await this.requester.makeRequest(method, url, request?.toObject(), additionalHeaders);
    // @ts-ignore
    return responseClass ? responseClass.fromObject(JSON.parse(response.content)) : null;
  };
}
