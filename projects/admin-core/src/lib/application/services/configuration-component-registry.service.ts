import { Injectable, Type } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

export type ConfigurationComponents = Map<BaseComponentTypeEnum, { component: Type<any>; label: string }>;

@Injectable({
  providedIn: 'root',
})
export class ConfigurationComponentRegistryService {

  private registeredComponents: ConfigurationComponents = new Map();
  private componentRegistry = new BehaviorSubject<ConfigurationComponents>(new Map());

  public registerConfigurationComponents(type: BaseComponentTypeEnum, label: string, component: Type<any>) {
    this.registeredComponents.set(type, { label, component });
    this.componentRegistry.next(this.registeredComponents);
  }

  public getAvailableConfigurationComponents$(): Observable<Array<{ type: BaseComponentTypeEnum; label: string }>> {
    return this.componentRegistry.asObservable().pipe(
      map((components) => {
        const availableComponents: Array<{ type: BaseComponentTypeEnum; label: string }> = [];
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
