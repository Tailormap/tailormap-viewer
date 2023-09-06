import { ComponentRef, ViewContainerRef } from '@angular/core';
import { RegisteredComponent } from '../models/registered-component.model';

export class DynamicComponentsHelper {

  public static destroyComponents(
    injectedComponents?: ComponentRef<any>[],
  ) {
    if (!injectedComponents || injectedComponents.length === 0) {
      return;
    }
    injectedComponents.forEach(existingComponent => {
      if (!existingComponent.destroy) {
        return;
      }
      existingComponent.destroy();
    });
  }

  public static createComponents(
    components: RegisteredComponent[],
    container: ViewContainerRef,
    clearContainerBeforeAddingComponents = true,
  ): ComponentRef<any>[] {
    const injectedComponents: ComponentRef<any>[] = [];
    if (clearContainerBeforeAddingComponents) {
      container.clear();
    }
    components.forEach(component => {
      const addedComponent = container.createComponent(component.component);
      injectedComponents.push(addedComponent.instance);
    });
    return injectedComponents;
  }

}
