
export class KibaException extends Error {
  public statusCode: number;
  public exceptionType: string;
  public fields: Record<string, string>;

  public constructor(message: string, statusCode?: number, exceptionType?: string, fields?: Record<string, string>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode || 500;
    this.exceptionType = exceptionType || 'KibaException';
    this.fields = fields || {};
  }
}
