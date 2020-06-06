export default class IpcResponse<T> {
  constructor(error: NodeJS.ErrnoException);
  constructor(data: T);
  constructor(value: any) {
    if ("code" in value) {
      // fail
      const error = value as NodeJS.ErrnoException;
      this.error = true;
      this.errorCode = error.code || "";
      this.errorMessage = error.message;
    } else if (value instanceof Error) {
      // fail
      const error = value as Error;
      this.error = true;
      this.errorCode = "";
      this.errorMessage = error.message;
    } else {
      // sucsses
      this.error = false;
      this.result = value;
      this.errorCode = "";
      this.errorMessage = "";
    }
  }

  public error: boolean;
  public errorCode: string;
  public errorMessage: string;
  public result!: T;
}
