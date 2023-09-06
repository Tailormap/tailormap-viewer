import { Injectable, Type } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

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

  public getAvailableConfigurationComponents$(): Observable<Array<{ type: string; label: string }>> {
    return this.componentRegistry.asObservable().pipe(
      map((components) => {
        const availableComponents: Array<{ type: string; label: string }> = [];
        components.forEach((value, key) => {
          availableComponents.push({ type: key, label: value.label });
        });
        return availableComponents;
      }));
  }

  public getRegisteredConfigurationComponents$(): Observable<ConfigurationComponents> {
    return this.componentRegistry.asObservable();
  }

}
