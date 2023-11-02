import {
  ChangeDetectionStrategy, Component, ComponentRef, DestroyRef, inject, Input, OnInit, Type, ViewChild, ViewContainerRef,
} from '@angular/core';
import { ConfigurationComponentRegistryService } from '../../services/configuration-component-registry.service';
import { Subject, takeUntil } from 'rxjs';
import { DynamicComponentsHelper } from '@tailormap-viewer/shared';
import { BaseComponentConfigComponent } from '../base-component-config/base-component-config.component';
import { Store } from '@ngrx/store';
import { selectComponentsConfigByType } from '../../state/application.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-component-config-renderer',
  templateUrl: './component-config-renderer.component.html',
  styleUrls: ['./component-config-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentConfigRendererComponent implements OnInit {

  private _selectedComponent: string | null = null;

  @Input()
  public set selectedComponent(value: string | null) {
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
  private renderedConfigurationComponent: ComponentRef<unknown> | undefined;
  private renderedConfigurationComponentSubject: Subject<null> | undefined;
  private availableComponents: Map<string, { component: Type<any>; label: string }> = new Map();

  public constructor(
    private store$: Store,
    private destroyRef: DestroyRef,
  ) {}

  public ngOnInit() {
    this.configurationComponentRegistryService.getRegisteredConfigurationComponents$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(availableComponents => {
        this.availableComponents = availableComponents;
      });
  }

  private renderActiveComponentConfiguration(selectedComponent?: string) {
    if (!this.componentConfigContainer) {
      return;
    }
    if (this.renderedConfigurationComponent) {
      DynamicComponentsHelper.destroyComponents([this.renderedConfigurationComponent]);
    }
    if (this.renderedConfigurationComponentSubject) {
      this.renderedConfigurationComponentSubject.next(null);
      this.renderedConfigurationComponentSubject.complete();
    }
    if (!selectedComponent) {
      return;
    }
    const configComponent: { component: Type<any>; label: string } = this.availableComponents.get(selectedComponent) || {
      component: BaseComponentConfigComponent,
      label: selectedComponent.charAt(0).toUpperCase() + selectedComponent.slice(1),
    };
    this.componentConfigContainer.clear();
    const renderedConfigurationComponent = this.componentConfigContainer.createComponent(configComponent.component);
    renderedConfigurationComponent.setInput('type', selectedComponent);
    renderedConfigurationComponent.setInput('label', configComponent.label);
    this.renderedConfigurationComponentSubject = new Subject<null>();
    this.store$.select(selectComponentsConfigByType(selectedComponent))
      .pipe(takeUntil(this.renderedConfigurationComponentSubject))
      .subscribe(componentModel => {
        renderedConfigurationComponent.setInput('config', componentModel?.config);
      });
    this.renderedConfigurationComponent = renderedConfigurationComponent;
  }
}
