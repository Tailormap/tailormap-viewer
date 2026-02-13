import { Component, ChangeDetectionStrategy, inject, DestroyRef, ElementRef, OnDestroy, viewChild, OnInit, input } from '@angular/core';
import { BaseComponentConfigHelper, BaseComponentTypeEnum, ComponentBaseConfigModel } from '@tailormap-viewer/api';
import { LayoutService } from '../../../layout/layout.service';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, filter, map, of, switchMap } from 'rxjs';
import { selectComponentsConfigForType, selectComponentTitle } from '../../../state/core.selectors';
import { TerrainControlsMenuButtonComponent } from './terrain-controls-menu-button/terrain-controls-menu-button.component';
import { ComponentRegistrationService } from '../../../services';
import { MenubarService } from '../../menubar';
import { selectIn3dView } from '../../../map';
import { withLatestFrom } from 'rxjs/operators';
import { MobileLayoutService } from '../../../services/viewer-layout/mobile-layout.service';

@Component({
  selector: 'tm-terrain-controls',
  templateUrl: './terrain-controls.component.html',
  styleUrls: ['./terrain-controls.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TerrainControlsComponent implements OnInit, OnDestroy {
  public layoutService = inject(LayoutService);
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);
  private componentRegistrationService = inject(ComponentRegistrationService);
  private menubarService = inject(MenubarService);
  private mobileLayoutService = inject(MobileLayoutService);


  public noExpansionPanel = input<boolean>(false);

  public tooltip: string = '';
  public opacityLabel: string = $localize `:@@core.terrain-controls.opacity:Terrain opacity`;
  public layerToggleLabel: string = $localize `:@@core.terrain-controls.model:Terrain model`;
  public componentTypes = BaseComponentTypeEnum;
  private resizeObserver?: ResizeObserver;
  public visible$ = combineLatest([
    this.menubarService.isComponentVisible$(BaseComponentTypeEnum.TERRAIN_CONTROLS),
    this.mobileLayoutService.isMobileLayoutEnabled$,
  ]).pipe(
    takeUntilDestroyed(this.destroyRef),
    map(([ visible, mobileLayoutEnabled ]) => visible || !mobileLayoutEnabled),
  );

  private panelContent = viewChild<ElementRef<HTMLDivElement>>('panelContent');

  public panelWidth = 100;

  constructor() {
    combineLatest([
      this.store$.select(selectComponentsConfigForType<ComponentBaseConfigModel>(BaseComponentTypeEnum.TERRAIN_OPACITY)),
      this.store$.select(selectComponentsConfigForType<ComponentBaseConfigModel>(BaseComponentTypeEnum.TERRAIN_LAYER_TOGGLE)),
    ]).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([ opacityConfig, layerToggleConfig ]) => {
        const tooltipParts: string[] = [];
        if (BaseComponentConfigHelper.isComponentEnabled(opacityConfig ? [opacityConfig] : [], BaseComponentTypeEnum.TERRAIN_OPACITY)) {
          this.opacityLabel = opacityConfig?.config.title || $localize `:@@core.terrain-controls.opacity:Terrain opacity`;
          tooltipParts.push(this.opacityLabel);
        }
        if (BaseComponentConfigHelper.isComponentEnabled(layerToggleConfig ? [layerToggleConfig] : [], BaseComponentTypeEnum.TERRAIN_LAYER_TOGGLE)) {
          this.layerToggleLabel = layerToggleConfig?.config.title || $localize `:@@core.terrain-controls.model:Terrain model`;
          tooltipParts.push(this.layerToggleLabel);
        }
        this.tooltip = tooltipParts.join(' & ');
      });

    this.menubarService.isComponentVisible$(BaseComponentTypeEnum.TERRAIN_CONTROLS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(visible => {
        if (visible) {
          this.menubarService.setMobilePanelHeight(310);
        }
      });

    // Switch back to Mobile Menu when switching to 2D view while terrain controls are open in mobile layout.
    combineLatest([
      this.menubarService.isComponentVisible$(BaseComponentTypeEnum.TERRAIN_CONTROLS),
      this.mobileLayoutService.isMobileLayoutEnabled$,
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(([ visible, mobileLayoutEnabled ]) => {
        if (!visible || !mobileLayoutEnabled) {
          return of(null);
        }
        return this.store$.select(selectIn3dView)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            withLatestFrom(this.store$.select(selectComponentTitle(BaseComponentTypeEnum.MOBILE_MENUBAR_HOME, $localize `:@@core.home.menu:Menu`))),
          );
      }),
      filter(tuple => !!tuple),
    ).subscribe(([ in3dView, componentTitle ]) => {
      if (!in3dView) {
        this.menubarService.toggleActiveComponent(BaseComponentTypeEnum.MOBILE_MENUBAR_HOME, componentTitle);
      }
    });
  }

  public onExpand() {
    const panelEl = this.panelContent()?.nativeElement;
    if (!panelEl) {
      return;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      this.updatePanelWidth(panelEl);
    });
    this.resizeObserver.observe(panelEl);
    this.updatePanelWidth(panelEl);
  }

  public onCollapse() {
    this.panelWidth = 100;
    this.resizeObserver?.disconnect();
  }

  private updatePanelWidth(el: HTMLDivElement) {
    this.panelWidth = el.scrollWidth + 48;
  }

  public ngOnInit(): void {
    this.componentRegistrationService.registerComponent('mobile-menu-home', { type: BaseComponentTypeEnum.TERRAIN_CONTROLS, component: TerrainControlsMenuButtonComponent });
  }

  public ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.componentRegistrationService.deregisterComponent('mobile-menu-home', BaseComponentTypeEnum.TERRAIN_CONTROLS);
  }

}
