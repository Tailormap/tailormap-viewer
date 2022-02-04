import { Type } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export abstract class BaseComponentRegistryService {

  private registeredComponents: Type<any>[] = [];
  private componentRegistry = new BehaviorSubject<Type<any>[]>([]);

  public registerComponent(component: Type<any>) {
    this.registeredComponents.push(component);
    this.componentRegistry.next([ ...this.registeredComponents ]);
  }

  public getRegisteredComponents$(): Observable<Type<any>[]> {
    return this.componentRegistry.asObservable();
  }

}
