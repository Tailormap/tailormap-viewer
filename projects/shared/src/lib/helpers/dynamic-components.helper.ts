import { ComponentRef, Type, ViewContainerRef } from '@angular/core';

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
    components: Type<any>[],
    container: ViewContainerRef,
    clearContainerBeforeAddingComponents = true,
  ): ComponentRef<any>[] {
    const injectedComponents: ComponentRef<any>[] = [];
    if (clearContainerBeforeAddingComponents) {
      container.clear();
    }
    components.forEach(component => {
      const addedComponent = container.createComponent(component);
      injectedComponents.push(addedComponent.instance);
    });
    return injectedComponents;
  }

}
