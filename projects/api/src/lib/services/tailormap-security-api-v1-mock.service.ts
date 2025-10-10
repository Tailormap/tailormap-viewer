import { Injectable } from '@angular/core';
import { LoginConfigurationModel, UserResponseModel } from '../models';
import { delay, Observable, of } from 'rxjs';
import { getLoginConfigurationModel, getUserResponseModel } from '../mock-data';
import { TailormapSecurityApiV1ServiceModel } from './tailormap-security-api-v1.service.model';

@Injectable()
export class TailormapSecurityApiV1MockService implements TailormapSecurityApiV1ServiceModel {
  public delay = 3000;

  public getLoginConfiguration$(): Observable<LoginConfigurationModel> {
      return of(getLoginConfigurationModel());
  }

  public getUser$(): Observable<UserResponseModel> {
    return of(getUserResponseModel());
  }

  public login$(): Observable<UserResponseModel> {
    return this.getUser$();
  }

  public logout$(): Observable<boolean> {
    return of(true);
  }

  public requestPasswordReset$(): Observable<boolean> {
    return of(true);
  }

  public validatePasswordStrength$(_password: string): Observable<boolean> {
    return of(true).pipe(delay(this.delay));
  }

  public resetPassword$(_token: string, _username: string, _newPassword: string): Observable<boolean> {
    return of(true).pipe(delay(this.delay));
  }
}
