import { Injectable } from '@angular/core';

export enum AdminFieldLocation {
  GROUP = 'GROUP',
}

export interface AdminFieldModel {
  name: string;
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

  private registeredFields = new Map<AdminFieldLocation, AdminFieldModel[]>();

  public registerFields(location: AdminFieldLocation, fields: AdminFieldModel[]) {
    const currentFields = this.registeredFields.get(location) || [];
    this.registeredFields.set(location, [ ...currentFields, ...fields ]);
  }

  public getRegisteredFields(location: AdminFieldLocation) {
    return this.registeredFields.get(location) || [];
  }

}
