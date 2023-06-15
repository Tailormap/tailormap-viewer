export type ApiErrorResponse = { error: string };

export class ApiResponseHelper {

  public static isErrorResponse<T>(res: T | ApiErrorResponse): res is ApiErrorResponse {
    return typeof (res as ApiErrorResponse).error !== 'undefined';
  }

}
