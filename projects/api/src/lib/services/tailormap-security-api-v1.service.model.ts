import { UserResponseModel, LoginConfigurationModel } from '../models';
import { Observable } from 'rxjs';

export interface TailormapSecurityApiV1ServiceModel {
  getLoginConfiguration$(): Observable<LoginConfigurationModel>;
  getUser$(): Observable<UserResponseModel>;
  login$(username: string, password: string): Observable<UserResponseModel>;
  logout$(): Observable<boolean>;
}
