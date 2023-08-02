import {
  ChangeDetectionStrategy, Component, ComponentRef, inject, Input, OnDestroy, OnInit, Type, ViewChild, ViewContainerRef,
} from '@angular/core';
import { ConfigurationComponentRegistryService } from '../../services/configuration-component-registry.service';
import { Subject, takeUntil } from 'rxjs';
import { DynamicComponentsHelper } from '@tailormap-viewer/shared';
import { BaseComponentConfigComponent } from '../base-component-config/base-component-config.component';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-admin-component-config-renderer',
  templateUrl: './component-config-renderer.component.html',
  styleUrls: ['./component-config-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentConfigRendererComponent implements OnInit, OnDestroy {

  private _selectedComponent: BaseComponentTypeEnum | null = null;

  @Input()
  public set selectedComponent(value: BaseComponentTypeEnum | null) {
    this._selectedComponent = value;
    if (this._selectedComponent) {
      this.renderActiveComponentConfiguration(this._selectedComponent);
    }
  }

  public get selectedComponent() {
    return this._selectedComponent;
  }

  @ViewChild('componentConfigContainer', { read: ViewContainerRef, static: true })
  private componentConfigContainer: ViewContainerRef | null = null;

  private configurationComponentRegistryService = inject(ConfigurationComponentRegistryService);
  private destroyed = new Subject();
  private renderedConfigurationComponent: ComponentRef<unknown> | undefined;
  private availableComponents: Map<BaseComponentTypeEnum, { component: Type<any>; label: string }> = new Map();

  public ngOnInit() {
    this.configurationComponentRegistryService.getRegisteredConfigurationComponents$()
      .pipe(takeUntil(this.destroyed))
      .subscribe(availableComponents => {
        this.availableComponents = availableComponents;
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private renderActiveComponentConfiguration(selectedComponent?: BaseComponentTypeEnum) {
    if (!this.componentConfigContainer) {
      return;
    }
    if (this.renderedConfigurationComponent) {
      DynamicComponentsHelper.destroyComponents([this.renderedConfigurationComponent]);
    }
    if (!selectedComponent) {
      return;
    }
    const configComponent: { component: Type<any>; label: string } = this.availableComponents.get(selectedComponent) || {
      component: BaseComponentConfigComponent,
      label: selectedComponent.charAt(0).toUpperCase() + selectedComponent.slice(1),
    };
    this.componentConfigContainer.clear();
    this.renderedConfigurationComponent = this.componentConfigContainer.createComponent(configComponent.component);
    this.renderedConfigurationComponent.setInput('type', selectedComponent);
    this.renderedConfigurationComponent.setInput('label', configComponent.label);
  }
}
