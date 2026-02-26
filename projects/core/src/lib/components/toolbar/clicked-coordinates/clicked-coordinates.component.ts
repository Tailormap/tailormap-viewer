import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal, input, DestroyRef } from '@angular/core';
import { combineLatest, concatMap, filter, map, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { MapClickEvent, MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { Clipboard } from '@angular/cdk/clipboard';
import { Store } from '@ngrx/store';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { BaseComponentTypeEnum, FeatureModel } from '@tailormap-viewer/api';
import { ApplicationStyleService } from '../../../services/application-style.service';
import { selectMapSettings } from '../../../map/state/map.selectors';
import { ComponentRegistrationService } from '../../../services';
import { MenubarService } from '../../menubar';
import { MobileLayoutService } from '../../../services/viewer-layout/mobile-layout.service';
import { ClickedCoordinatesMenuButtonComponent } from './clicked-coordinates-menu-button/clicked-coordinates-menu-button.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { withLatestFrom } from 'rxjs/operators';
import { selectComponentTitle } from '../../../state';


@Component({
  selector: 'tm-clicked-coordinates',
  templateUrl: './clicked-coordinates.component.html',
  styleUrls: ['./clicked-coordinates.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ClickedCoordinatesComponent implements OnInit, OnDestroy {
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private clipboard = inject(Clipboard);
  private componentRegistrationService = inject(ComponentRegistrationService);
  private menubarService = inject(MenubarService);
  private mobileLayoutService = inject(MobileLayoutService);
  private destroyRef = inject(DestroyRef);


  public noExpansionPanel = input<boolean>(false);

  public toolActive = signal<boolean>(false);

  public coordinatesForm = new FormGroup({
    x: new FormControl<number | null>(null),
    y: new FormControl<number | null>(null),
    minx: new FormControl<number | null>(null),
    miny: new FormControl<number | null>(null),
    maxx: new FormControl<number | null>(null),
    maxy: new FormControl<number | null>(null),
  }, { validators: validateCoordinates() });

  private destroyed = new Subject();
  private clickLocationSubject = new Subject<FeatureModel[]>();
  private clickLocationSubject$ = this.clickLocationSubject.asObservable();
  private crs: string = '';
  private tool: string | undefined;
  public visible$ = combineLatest([
    this.menubarService.isComponentVisible$(BaseComponentTypeEnum.COORDINATE_PICKER),
    this.mobileLayoutService.isMobileLayoutEnabled$,
  ]).pipe(
    takeUntilDestroyed(this.destroyRef),
    map(([ visible, mobileLayoutEnabled ]) => visible || !mobileLayoutEnabled),
  );

  constructor() {
    this.mapService.someToolsEnabled$([BaseComponentTypeEnum.COORDINATE_PICKER])
      .pipe(takeUntil(this.destroyed))
      .subscribe(enabled => {
        this.toolActive.set(enabled);
        if (!enabled) {
          //only reset the input fields, not the hidden fields
          this.coordinatesForm.patchValue({ x: null, y:  null }, { emitEvent: false });
          this.clickLocationSubject.next([]);
        }
      });
    this.store$.select(selectMapSettings).pipe(
      takeUntil(this.destroyed),
      map(settings => {
        if (settings?.crs?.bounds && settings?.maxExtent) {
          this.crs = settings?.crs?.code;
          const bounds = settings?.crs?.bounds;
          const maxExtent = settings?.maxExtent;
          return [
             // get the smallest bounds of both extents
             Math.max(bounds.minx, maxExtent.minx),
             Math.max(bounds.miny, maxExtent.miny),
             Math.min(bounds.maxx, maxExtent.maxx),
             Math.min(bounds.maxy, maxExtent.maxy),
          ];
        } else {
          return [];
        }
      })).subscribe(bounds => {
        if(bounds.length > 0) {
          this.coordinatesForm.patchValue({
            minx: bounds[0], miny: bounds[1], maxx: bounds[2], maxy: bounds[3],
          }, { emitEvent: false });
        }
    });
  }

  public ngOnInit(): void {
    this.mapService.createTool$<MapClickToolModel, MapClickToolConfigModel>({
      type: ToolTypeEnum.MapClick,
      owner: BaseComponentTypeEnum.COORDINATE_PICKER,
    })
      .pipe(
        takeUntil(this.destroyed),
        tap(({ tool }) => {
          this.tool = tool.id;
        }),
        concatMap(({ tool }) => tool?.mapClick$ || of(null)),
      ).subscribe(mapClick => this.handleMapClick(mapClick));

    this.mapService.renderFeatures$('tm-clicked-coordinates-layer', this.clickLocationSubject$, f => {
      const primaryColor = ApplicationStyleService.getPrimaryColor();
      // draw a circle with a box inside
      if (f.__fid === 'clicked-coordinates-point') {
        return {
          styleKey: 'tm-clicked-coordinates',
          zIndex: 2000,
          pointType: 'circle',
          pointSize: 15,
          pointFillColor: 'transparent',
          pointStrokeColor: primaryColor,
          pointStrokeWidth: 3,
        };
      } else {
        return {
          styleKey: 'tm-clicked-coordinates-2',
          zIndex: 1999,
          pointType: 'square',
          pointSize: 5,
          pointRotation: 45,
          pointFillColor: 'transparent',
          pointStrokeColor: primaryColor,
          pointStrokeWidth: 2,
        };
      }
    }).pipe(takeUntil(this.destroyed)).subscribe();

    this.componentRegistrationService.registerComponent(
      'mobile-menu-home',
      { type: BaseComponentTypeEnum.COORDINATE_PICKER, component: ClickedCoordinatesMenuButtonComponent },
    );

    // Toggle the CLW map tool when the CLW menu button is clicked in the mobile layout.
    this.mobileLayoutService.isMobileLayoutEnabled$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(enabled => enabled),
        switchMap(() => this.menubarService.isComponentVisible$(BaseComponentTypeEnum.COORDINATE_PICKER)),
      ).subscribe(visibleInMobileLayout => {
      if (visibleInMobileLayout) {
        this.menubarService.setMobilePanelHeight(230);
        this.toggle(false);
      } else if (this.toolActive()) {
        this.toggle(true);
      }
    });

    // Close the CLW when the mapTool is disabled by another component.
    this.mapService.someToolsEnabled$([BaseComponentTypeEnum.COORDINATE_PICKER])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        withLatestFrom(
          this.menubarService.isComponentVisible$(BaseComponentTypeEnum.COORDINATE_PICKER),
          this.store$.select(selectComponentTitle(BaseComponentTypeEnum.MOBILE_MENUBAR_HOME, $localize `:@@core.home.menu:Menu`)),
        ),
      )
      .subscribe(([ enabledTool, visible, componentTitle ]) => {
        if (!enabledTool && visible) {
          this.menubarService.toggleActiveComponent(BaseComponentTypeEnum.MOBILE_MENUBAR_HOME, componentTitle);
        }
      });
  }

  public ngOnDestroy() {
    this.clickLocationSubject.complete();
    this.destroyed.next(null);
    this.destroyed.complete();
    this.componentRegistrationService.deregisterComponent('mobile-menu-home', BaseComponentTypeEnum.COORDINATE_PICKER);
  }

  public toggle(close?: boolean) {
    if (close === true || this.toolActive()) {
      this.mapService.disableTool(this.tool);
      return;
    }
    this.mapService.enableTool(this.tool, true);
  }

  public copy() {
    if (this.coordinatesForm.valid) {
      this.clipboard.copy(`${this.coordinatesForm.get('x')?.value}, ${this.coordinatesForm.get('y')?.value}`);
    }
  }

  public goTo() {
    if (this.coordinatesForm.valid) {
      const x = this.coordinatesForm.getRawValue().x;
      const y = this.coordinatesForm.getRawValue().y;
      if (x != null && y != null) {
        this.pushLocationFeature([ x, y ]);
        this.mapService.zoomTo(`POINT(${x} ${y})`, this.crs);
      }
    }
  }

  private handleMapClick(mapClick: MapClickEvent) {
    if (mapClick && mapClick.mapCoordinates) {
      this.pushLocationFeature(mapClick.mapCoordinates);
      this.mapService.getRoundedCoordinates$(mapClick.mapCoordinates)
        .pipe(take(1), map(coordinates => {
          this.coordinatesForm.patchValue({ x: parseFloat(coordinates[0]), y: parseFloat(coordinates[1]) });
        })).subscribe();
    }
  }

  private pushLocationFeature(coordinates: number[]) {
    this.clickLocationSubject.next([{
      __fid: 'clicked-coordinates-point', geometry: `POINT(${coordinates[0]} ${coordinates[1]})`, attributes: {},
    }, {
      __fid: 'clicked-coordinates-point-2', geometry: `POINT(${coordinates[0]} ${coordinates[1]})`, attributes: {},
    }]);
  }
}

export function validateCoordinates(): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const values = form.getRawValue();
    return values.x !== null && values.y !== null &&
      values.x >= values.minx && values.x <= values.maxx &&
      values.y >= values.miny && values.y <= values.maxy ? null : { invalidCoordinates: true };
  };
}
