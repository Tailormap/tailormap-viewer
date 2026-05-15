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
      injectedComponents.push(addedComponent);
    });
    return injectedComponents;
  }

  public static createComponentsForPosition(
    components: RegisteredComponent[],
    containers: Record<string, ViewContainerRef>,
    clearContainerBeforeAddingComponents = true,
    defaultPosition?: string,
  ): ComponentRef<any>[] {
    if (clearContainerBeforeAddingComponents) {
      Object.entries(containers).forEach(([ _, container ]) => container.clear());
    }
    const containerKeys = Object.keys(containers);
    const resolvedDefaultPosition = defaultPosition
      ?? ('default' in containers ? 'default' : undefined)
      ?? (containerKeys.length === 1 ? containerKeys[0] : undefined);
    const injectedComponents: ComponentRef<any>[] = [];
    const componentsByPosition = new Map<string, RegisteredComponent[]>();
    components.forEach(component => {
      const position = component.position ?? resolvedDefaultPosition;
      if (!position) {
        console.warn(
          'DynamicComponentsHelper.createComponentsForPosition: skipping component without position because no default container could be resolved.',
          component,
        );
        return;
      }
      if (!componentsByPosition.has(position)) {
        componentsByPosition.set(position, []);
      }
      componentsByPosition.get(position)?.push(component);
    });
    componentsByPosition.forEach((componentsForPosition, position) => {
      const container = containers[position];
      if (!container) {
        console.warn(
          `DynamicComponentsHelper.createComponentsForPosition: skipping components for unknown position "${position}".`,
          componentsForPosition,
        );
        return;
      }
      injectedComponents.push(...this.createComponents(componentsForPosition, container, false));
    });
    return injectedComponents;
  }

}
