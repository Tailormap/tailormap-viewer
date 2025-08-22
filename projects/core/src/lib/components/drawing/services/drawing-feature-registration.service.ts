import { Injectable, signal, Type } from '@angular/core';

interface AdditionalDrawingFeatureModel {
  component: Type<any>;
  type: string;
}

@Injectable({
  providedIn: 'root',
})
export class DrawingFeatureRegistrationService {

  private registeredComponents = signal<AdditionalDrawingFeatureModel[]>([]);
  public registeredAdditionalDrawingFeatures = this.registeredComponents.asReadonly();

  public registerAdditionalDrawingFeature(component: AdditionalDrawingFeatureModel) {
    const registeredComponents = [...this.registeredComponents()];
    const idx = registeredComponents.findIndex(c => c.type === component.type);
    if (idx !== -1) {
      registeredComponents.splice(idx, 1);
    }
    registeredComponents.push(component);
    this.registeredComponents.set([...registeredComponents]);
  }

  public deregisterAdditionalDrawingFeature(componentType: string) {
    this.registeredComponents.set(this.registeredComponents().filter(c => c.type !== componentType));
  }

}
