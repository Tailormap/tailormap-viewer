import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, OnDestroy, OnInit, Output } from '@angular/core';
import { ConfigurationComponentRegistryService } from '../../services/configuration-component-registry.service';
import { map, Observable, of, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectDisabledComponentsForSelectedApplication } from '../../state/application.selectors';

@Component({
  selector: 'tm-admin-components-list',
  templateUrl: './components-list.component.html',
  styleUrls: ['./components-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsListComponent implements OnInit, OnDestroy {

  public listOfComponents$: Observable<Array<{ type: string; label: string }>>;

  @Output()
  public selectComponent = new EventEmitter<string>();

  public selectedComponent: string | null = null;
  private destroyed = new Subject();
  public disabledComponents: Set<string> = new Set();

  constructor(
    private configurationComponentRegistryService: ConfigurationComponentRegistryService,
    private store$: Store,
    private cdr: ChangeDetectorRef,
  ) {
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
