import { BehaviorSubject, Observable } from 'rxjs';
import { RegisteredComponent } from '../models/registered-component.model';

export abstract class BaseComponentRegistryService {

  private registeredComponents: RegisteredComponent[] = [];
  private componentRegistry = new BehaviorSubject<RegisteredComponent[]>([]);

  public registerComponent(component: RegisteredComponent, singleton = true) {
    const idx = this.registeredComponents.findIndex(c => c.type === component.type);
    if (singleton && idx !== -1) {
      this.registeredComponents = [
        ...this.registeredComponents.slice(0, idx),
        ...this.registeredComponents.slice(idx + 1),
      ];
    }
    this.registeredComponents.push(component);
    this.componentRegistry.next([...this.registeredComponents]);
  }

  public getRegisteredComponents$(): Observable<RegisteredComponent[]> {
    return this.componentRegistry.asObservable();
  }

}
