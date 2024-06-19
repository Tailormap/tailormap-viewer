import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

export enum AdminFieldLocation {
  GROUP = 'GROUP',
  USER = 'USER',
}

export interface AdminFieldModel {
  key: string;
  label: string;
  type: 'text' | 'choice' | 'checkbox';
  dataType: 'string' | 'boolean' | 'number';
  values?: string[];
  isPublic?: boolean;
  hint?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminFieldRegistrationService {

  private registeredFieldsSubject = new BehaviorSubject<Map<AdminFieldLocation, AdminFieldModel[]>>(new Map());

  public registerFields(location: AdminFieldLocation, fields: AdminFieldModel[]) {
    const currentMap = this.registeredFieldsSubject.value;
    const currentFields = currentMap.get(location) || [];
    const updatedMap = new Map(currentMap).set(location, [ ...currentFields, ...fields ]);
    this.registeredFieldsSubject.next(updatedMap);
  }

  public getRegisteredFields$(location: AdminFieldLocation): Observable<AdminFieldModel[]> {
    return this.registeredFieldsSubject.asObservable()
      .pipe(map(fields => fields.get(location) || []));
  }

}
