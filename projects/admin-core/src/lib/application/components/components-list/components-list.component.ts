import { ChangeDetectionStrategy, Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { ConfigurationComponentRegistryService } from '../../services/configuration-component-registry.service';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'tm-admin-components-list',
  templateUrl: './components-list.component.html',
  styleUrls: ['./components-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsListComponent implements OnInit {

  private configurationComponentRegistryService = inject(ConfigurationComponentRegistryService);

  public listOfComponents$: Observable<Array<{ type: string; label: string }>>;

  @Output()
  public selectComponent = new EventEmitter<string>();

  public selectedComponent: string | null = null;

  constructor() {
    this.listOfComponents$ = this.configurationComponentRegistryService.getRegisteredConfigurationComponents$()
      .pipe(
        map((components) => {
          const componentsList: Array<{ type: string; label: string }> = [];
          components.forEach((value, key) => {
            componentsList.push({ type: key, label: value.label });
          });
          return componentsList;
        }),
      );
  }

  public ngOnInit(): void {
  }

  public setActiveComponent(component: string) {
    this.selectedComponent = component;
    this.selectComponent.emit(component);
  }
}
