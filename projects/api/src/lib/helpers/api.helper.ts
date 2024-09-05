import { HttpParams } from '@angular/common/http';
import { ErrorResponseModel } from '../models';

export class ApiHelper {

  public static getQueryParams(params: Record<string, string | number | boolean | undefined>): HttpParams {
    let queryParams = new HttpParams();
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (typeof value !== 'undefined') {
        queryParams = queryParams = queryParams.set(key, value);
      }
    });
    return queryParams;
  }

  public static isApiErrorResponse(response: any): response is ErrorResponseModel {
    return typeof (response as ErrorResponseModel).message !== "undefined"
      && typeof (response as ErrorResponseModel).code !== "undefined";
  }

}
