import { signal } from '@angular/core';
import { RegisteredComponent } from '@tailormap-viewer/shared';

export class BaseFeatureRegistrationService<T extends RegisteredComponent = RegisteredComponent> {

  private registeredComponents = signal<T[]>([]);
  public registeredAdditionalFeatures = this.registeredComponents.asReadonly();

  public registerAdditionalFeature(component: T) {
    const registeredComponents = [...this.registeredComponents()];
    const idx = registeredComponents.findIndex(c => c.type === component.type);
    if (idx !== -1) {
      registeredComponents.splice(idx, 1);
    }
    registeredComponents.push(component);
    this.registeredComponents.set([...registeredComponents]);
  }

  public deregisterAdditionalFeature(componentType: string) {
    this.registeredComponents.set(this.registeredComponents().filter(c => c.type !== componentType));
  }

}
