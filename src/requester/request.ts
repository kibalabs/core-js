import { RestMethod } from './restMethod';

export class KibaRequest {
  public method: RestMethod;
  public url: string;
  public headers: Record<string, string>;
  public data: Record<string, unknown> | null;
  public formData: FormData | null;
  public date: Date;
  public timeoutSeconds: number | null;

  public constructor(method: RestMethod, url: string, headers?: Record<string, string>, data?: Record<string, unknown>, formData?: FormData, date?: Date, timeoutSeconds?: number) {
    this.method = method;
    this.url = url;
    this.headers = headers || {};
    this.data = data || null;
    this.formData = formData || null;
    this.date = date || new Date();
    this.timeoutSeconds = timeoutSeconds && timeoutSeconds > 0 ? timeoutSeconds : null;
  }
}
