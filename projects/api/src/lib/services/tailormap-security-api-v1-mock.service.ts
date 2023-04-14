import { Injectable } from '@angular/core';
import { UserResponseModel } from '../models';
import { Observable, of } from 'rxjs';
import { getUserResponseModel } from '../mock-data';
import { TailormapSecurityApiV1ServiceModel } from './tailormap-security-api-v1.service.model';

@Injectable()
export class TailormapSecurityApiV1MockService implements TailormapSecurityApiV1ServiceModel {

  public getUser$(): Observable<UserResponseModel> {
    return of(getUserResponseModel());
  }

  public login$(): Observable<UserResponseModel> {
    return this.getUser$();
  }

  public logout$(): Observable<boolean> {
    return of(true);
  }

}
