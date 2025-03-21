import { UserResponseModel, LoginConfigurationModel } from '../models';
import { Observable } from 'rxjs';
import { ExtendedUserResponseModel } from '../models/extended-user-response.model';

export interface TailormapSecurityApiV1ServiceModel {
  getLoginConfiguration$(): Observable<LoginConfigurationModel>;
  getUser$(): Observable<ExtendedUserResponseModel>;
  login$(username: string, password: string): Observable<UserResponseModel>;
  logout$(): Observable<boolean>;
}
