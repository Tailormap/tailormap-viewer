import { Injectable, Type } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ConfigurationComponents = Map<string, { component: Type<any>; label: string }>;

@Injectable({
  providedIn: 'root',
})
export class ConfigurationComponentRegistryService {

  private registeredComponents: ConfigurationComponents = new Map();
  private componentRegistry = new BehaviorSubject<ConfigurationComponents>(new Map());

  public registerConfigurationComponents(type: string, label: string, component: Type<any>) {
    this.registeredComponents.set(type, { label, component });
    this.componentRegistry.next(this.registeredComponents);
  }

  public getRegisteredConfigurationComponents$(): Observable<ConfigurationComponents> {
    return this.componentRegistry.asObservable();
  }

}
