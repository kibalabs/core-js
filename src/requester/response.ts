export class KibaResponse {
  public status: number;
  public headers: Record<string, string> = {};
  public date: Date;
  public content = '';

  public constructor(status: number, headers: Record<string, string>, date: Date, content: string) {
    this.status = status;
    this.headers = headers;
    this.date = date;
    this.content = content;
  }
}
