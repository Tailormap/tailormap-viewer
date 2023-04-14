import { UserResponseModel } from '../models';
import { Observable } from 'rxjs';

export interface TailormapSecurityApiV1ServiceModel {
  getUser$(): Observable<UserResponseModel>;
  login$(username: string, password: string): Observable<UserResponseModel>;
  logout$(): Observable<boolean>;
}
