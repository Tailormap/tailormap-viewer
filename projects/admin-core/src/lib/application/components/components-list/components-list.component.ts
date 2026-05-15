import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { ConfigurationComponentRegistryService } from '../../services/configuration-component-registry.service';
import { combineLatest, map, Observable, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectDisabledComponentsForSelectedApplication, selectDraftApplication3dEnabled } from '../../state/application.selectors';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-admin-components-list',
  templateUrl: './components-list.component.html',
  styleUrls: ['./components-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ComponentsListComponent implements OnInit, OnDestroy {
  private configurationComponentRegistryService = inject(ConfigurationComponentRegistryService);
  private store$ = inject(Store);
  private cdr = inject(ChangeDetectorRef);


  private static readonly COMPONENTS_ONLY_USED_IN_3D: string[] = [
    BaseComponentTypeEnum.TERRAIN_LAYER_TOGGLE,
    BaseComponentTypeEnum.TERRAIN_OPACITY,
  ];

  public listOfComponents$: Observable<Array<{ type: string; label: string }>>;

  @Output()
  public selectComponent = new EventEmitter<string>();

  public selectedComponent: string | null = null;
  private destroyed = new Subject();
  public disabledComponents: Set<string> = new Set();

  constructor() {
    this.listOfComponents$ = combineLatest([
      this.configurationComponentRegistryService.getRegisteredConfigurationComponents$(),
      this.store$.select(selectDraftApplication3dEnabled),
    ])
      .pipe(
        map(([ components, is3dEnabled ]) => {
          const componentsList: Array<{ type: string; label: string }> = [];
          components.forEach((value, key) => {
            if (is3dEnabled || !ComponentsListComponent.COMPONENTS_ONLY_USED_IN_3D.includes(key)) {
              componentsList.push({ type: key, label: value.label });
            }
          });
          return componentsList.sort((a, b) => a.label.localeCompare(b.label));
        }),
      );
  }

  public ngOnInit(): void {
    this.store$.select(selectDisabledComponentsForSelectedApplication)
      .pipe(takeUntil(this.destroyed))
      .subscribe((disabledComponents) => {
        this.disabledComponents = new Set(disabledComponents);
        this.cdr.detectChanges();
      });
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public setActiveComponent(component: string) {
    this.selectedComponent = component;
    this.selectComponent.emit(component);
  }
}
