export type ApiErrorResponse = { error: string };

export class ApiResponseHelper {

  // For viewer API
  public static isErrorResponse<T>(res: T | ApiErrorResponse): res is ApiErrorResponse {
    return typeof (res as ApiErrorResponse).error !== 'undefined';
  }

  // For admin API (JSON produced by Spring Data REST RepositoryRestExceptionHandler) - get message for response with non-OK HTTP status
  public static getAdminApiErrorMessage(error: any) {
    if (error.name === 'HttpErrorResponse' && Array.isArray(error.error?.errors)) {
      return error.error.errors.map((e: { entity: string; property: string; invalidValue: string; message: string }) => e.message).join(", ");
    } else {
      return error + "";
    }
  }

}
