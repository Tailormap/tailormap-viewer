export type ApiErrorResponse = { error: string };

export class ApiResponseHelper {

  // For viewer API
  public static isErrorResponse<T>(res: T | ApiErrorResponse): res is ApiErrorResponse {
    return typeof (res as ApiErrorResponse).error !== 'undefined';
  }

  // For admin API (JSON produced by Spring Data REST RepositoryRestExceptionHandler) - get message for response with non-OK HTTP status
  public static getAdminApiErrorMessage(error: any) {
    if (error.name !== 'HttpErrorResponse') {
      return error + '';
    }
    const body = error.error;
    if (body === null) {
      return `HTTP status ${error.status}: ${error.statusText}`;
    }
    if (Array.isArray(body.errors)) {
      return body.errors.map((e: { entity: string; property: string; invalidValue: string; message: string }) => e.message).join(", ");
    }
    if (typeof body.error === 'string' && body.message) {
      return `${body.error}: ${body.message}`;
    }
    return typeof body === 'object' ? JSON.stringify(body) : `${body}`;
  }

}
