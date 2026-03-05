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

export type ResponseDataClass<T extends ResponseData> = {
  fromObject: (obj: RawObject) => T;
};

export class ServiceClient {
  protected requester: Requester;
  public baseUrl: string;

  public constructor(requester: Requester, baseUrl: string) {
    this.requester = requester;
    this.baseUrl = baseUrl;
  }

  protected makeRequest = async <ResponseType extends ResponseData>(method: RestMethod, path: string, request?: RequestData | undefined, responseClass?: ResponseDataClass<ResponseType> | undefined, additionalHeaders?: Record<string, string>): Promise<ResponseType> => {
    const url = `${this.baseUrl}/${path}`;
    const response = await this.requester.makeRequest(method, url, request?.toObject(), additionalHeaders);
    return responseClass ? responseClass.fromObject(JSON.parse(response.content) as RawObject) : null as ResponseType;
  };

  protected makeStreamingRequest = async <StreamItemType extends ResponseData>(
    method: RestMethod,
    path: string,
    request: RequestData | undefined,
    streamItemClass: ResponseDataClass<StreamItemType>,
    onStreamItem: (streamItem: StreamItemType) => void,
    additionalHeaders?: Record<string, string>,
  ): Promise<void> => {
    const url = `${this.baseUrl}/${path}`;
    await this.requester.makeStreamingRequest(
      method,
      url,
      request?.toObject(),
      streamItemClass.fromObject,
      onStreamItem,
      additionalHeaders,
    );
  };
}
