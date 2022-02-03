import { ComponentFactoryResolver, ComponentRef, Type, ViewContainerRef } from '@angular/core';

export class DynamicComponentsHelper {

  public static destroyComponents(
    injectedComponents?: ComponentRef<any>[],
  ) {
    if (!injectedComponents || injectedComponents.length === 0) {
      return;
    }
    injectedComponents.forEach(existingComponent => existingComponent.destroy());
  }

  public static createComponents(
    components: Type<any>[],
    container: ViewContainerRef,
    componentFactoryResolver: ComponentFactoryResolver,
    clearContainerBeforeAddingComponents = true,
  ): ComponentRef<any>[] {
    const injectedComponents: ComponentRef<any>[] = [];
    if (clearContainerBeforeAddingComponents) {
      container.clear();
    }
    components.forEach(component => {
      const componentFactory = componentFactoryResolver.resolveComponentFactory(component);
      const addedComponent = container.createComponent(componentFactory);
      injectedComponents.push(addedComponent.instance);
    });
    return injectedComponents;
  }

}
