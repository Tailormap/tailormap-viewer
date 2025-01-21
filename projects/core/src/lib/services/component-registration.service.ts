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

  public registerComponent(area: AreaType, component: RegisteredComponent, singleton = true) {
    if (!this.registeredComponents[area]) {
      this.registeredComponents[area] = [];
    }
    const idx = this.registeredComponents[area].findIndex(c => c.type === component.type);
    if (singleton && idx !== -1) {
      this.registeredComponents[area] = [
        ...this.registeredComponents[area].slice(0, idx),
        ...this.registeredComponents[area].slice(idx + 1),
      ];
    }
    if (idx !== -1) {
      this.registeredComponents[area].splice(idx, 0, component);
    } else {
      this.registeredComponents[area].push(component);
    }
    if (!this.componentRegistry[area]) {
      this.componentRegistry[area] = new BehaviorSubject<RegisteredComponent[]>([]);
    }
    this.componentRegistry[area].next([...this.registeredComponents[area]]);
  }

  public getRegisteredComponents$(area: AreaType): Observable<RegisteredComponent[]> {
    if (!this.componentRegistry[area]) {
      this.componentRegistry[area] = new BehaviorSubject<RegisteredComponent[]>([]);
    }
    return this.componentRegistry[area].asObservable();
  }

}
