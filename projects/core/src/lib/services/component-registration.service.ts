import { Injectable } from '@angular/core';
import { RegisteredComponent } from '@tailormap-viewer/shared';
import { BehaviorSubject, Observable } from 'rxjs';

export type AreaType = 'panel' | 'menu' | 'map' | 'map-controls-left' | 'map-controls-right' | 'map-controls-left-bottom' | 'map-controls-right-bottom' | string;

@Injectable({
  providedIn: 'root',
})
export class ComponentRegistrationService {

  private registeredComponents: Record<AreaType, RegisteredComponent[]> = {};
  private componentRegistry: Record<AreaType, BehaviorSubject<RegisteredComponent[]>> = {};
  private registrationOrder: Record<AreaType, string[]> = {};

  public registerComponent(area: AreaType, component: RegisteredComponent, singleton = true) {
    if (!this.registeredComponents[area]) {
      this.registeredComponents[area] = [];
      this.registrationOrder[area] = [];
    }
    const idx = this.registeredComponents[area].findIndex(c => c.type === component.type);
    if (singleton && idx !== -1) {
      this.registeredComponents[area] = [
        ...this.registeredComponents[area].slice(0, idx),
        ...this.registeredComponents[area].slice(idx + 1),
      ];
    }
    if (!this.registrationOrder[area].includes(component.type)) {
      this.registrationOrder[area].push(component.type);
    }
    this.registeredComponents[area].push(component);
    if (!this.componentRegistry[area]) {
      this.componentRegistry[area] = new BehaviorSubject<RegisteredComponent[]>([]);
    }
    this.orderRegisteredComponents(area);
    this.componentRegistry[area].next([...this.registeredComponents[area]]);
  }

  public deregisterComponent(area: AreaType, componentType: string) {
    if (!this.registeredComponents[area]) {
      this.registeredComponents[area] = [];
    }
    this.registeredComponents[area] = this.registeredComponents[area].filter(c => c.type !== componentType);
    this.componentRegistry[area].next([...this.registeredComponents[area]]);
  }

  public getRegisteredComponents$(area: AreaType): Observable<RegisteredComponent[]> {
    if (!this.componentRegistry[area]) {
      this.componentRegistry[area] = new BehaviorSubject<RegisteredComponent[]>([]);
    }
    return this.componentRegistry[area].asObservable();
  }

  private orderRegisteredComponents(area: AreaType) {
    const orderedComponents: RegisteredComponent[] = [];
    this.registrationOrder[area].forEach(type => {
      const componentsOfType = this.registeredComponents[area].filter(c => c.type === type);
      orderedComponents.push(...componentsOfType);
    });
    this.registeredComponents[area] = [...orderedComponents];
  }

}
