import {
  Component, OnInit, ChangeDetectionStrategy, Input, ViewChild, ViewContainerRef, ChangeDetectorRef, DestroyRef,
} from '@angular/core';
import { BaseComponentTypeEnum, ComponentModel } from '@tailormap-viewer/api';
import { AreaType, ComponentRegistrationService } from '../../services/component-registration.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { DynamicComponentsHelper } from '@tailormap-viewer/shared';
import { ComponentConfigHelper } from '../../shared/helpers/component-config.helper';
import { map, combineLatest } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectIn3DView } from '../../map/state/map.selectors';

@Component({
  selector: 'tm-registered-components-renderer',
  templateUrl: './registered-components-renderer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisteredComponentsRendererComponent implements OnInit {

  @Input({ required: true })
  public area: AreaType | string = '';

  @Input({ required: true })
  public config: ComponentModel[] = [];

  @ViewChild('componentsContainer', { read: ViewContainerRef, static: true })
  private componentsContainer: ViewContainerRef | null = null;

  private disallowingComponents = [
    BaseComponentTypeEnum.PRINT,
    BaseComponentTypeEnum.DRAWING,
    BaseComponentTypeEnum.MEASURE,
    BaseComponentTypeEnum.MOUSE_COORDINATES,
    BaseComponentTypeEnum.SCALE_BAR,
  ];

  private componentsOnlyIn3D = [
    BaseComponentTypeEnum.TERRAIN_LAYER_TOGGLE,
  ];

  constructor(
    private componentRegistrationService: ComponentRegistrationService,
    private cdr: ChangeDetectorRef,
    private destroyRef: DestroyRef,
    private store$: Store,
  ) { }

  public ngOnInit(): void {
    combineLatest([
      this.componentRegistrationService.getRegisteredComponents$(this.area),
      this.store$.select(selectIn3DView),
    ]).pipe(
      map(([ components, in3D ]) => {
        if (in3D) {
          return components.filter(
            component => !this.disallowingComponents.some(disallowingComponent => disallowingComponent === component.type),
          );
        }
        return components.filter(
          component => !this.componentsOnlyIn3D.some(componentOnlyIn3D => componentOnlyIn3D === component.type),
        );
      }),
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(10),
      )
      .subscribe(components => {
        if (!this.componentsContainer) {
          return;
        }
        DynamicComponentsHelper.createComponents(
          ComponentConfigHelper.filterDisabledComponents(components, this.config),
          this.componentsContainer,
        );
        this.cdr.detectChanges();
      });
  }

}
