import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { DrawingToolConfigModel, DrawingToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { map, Observable, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { activateTool, deactivateTool, deregisterTool, registerTool } from '../state/toolbar.actions';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { selectActiveTool } from '../state/toolbar.selectors';
import { ApplicationStyleService } from '../../../services/application-style.service';
import { selectComponentsConfigForType } from '../../../state/core.selectors';
import { BaseComponentTypeEnum, MeasureComponentConfigModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-measure',
  templateUrl: './measure.component.html',
  styleUrls: ['./measure.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MeasureComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public toolActive: 'length' | 'area' | null = null;
  private featureGeom = new Subject<string>();

  private defaultLengthTooltip = $localize `:@@core.toolbar.measure-length:Measure distance`;
  private defaultAreaTooltip = $localize `:@@core.toolbar.measure-area:Measure area`;
  public tooltips$: Observable<{ length: string; area: string }>;

  constructor(
    private store$: Store,
    private mapService: MapService,
    private cdr: ChangeDetectorRef,
  ) {
    this.tooltips$ = this.store$.select(selectComponentsConfigForType<MeasureComponentConfigModel>(BaseComponentTypeEnum.MEASURE))
      .pipe(
        map(config => {
          return {
            length: config?.config?.title || this.defaultLengthTooltip,
            area: config?.config?.titleMeasureArea || this.defaultAreaTooltip,
          };
        }),
      );
  }

  public ngOnInit(): void {
    this.store$.select(selectActiveTool)
      .pipe(takeUntil(this.destroyed))
      .subscribe(activeTool => {
        if (activeTool === ToolbarComponentEnum.MEASURE) {
          return;
        }
        this.hideGeometry();
        this.toolActive = null;
        this.cdr.detectChanges();
      });

    this.mapService.renderFeatures$('measurement-layer', this.featureGeom.asObservable(), {
      styleKey: 'measurement-style',
      zIndex: 9999,
      strokeColor: ApplicationStyleService.getPrimaryColor(),
      strokeWidth: 3,
      showTotalSize: true,
    }, { updateWhileAnimating: true }).pipe(takeUntil(this.destroyed)).subscribe();

    this.mapService.createTool$<DrawingToolModel, DrawingToolConfigModel>({
      type: ToolTypeEnum.Draw,
      style: {
        strokeColor: ApplicationStyleService.getPrimaryColor(),
        pointFillColor: 'transparent',
        pointStrokeColor: ApplicationStyleService.getPrimaryColor(),
        showTotalSize: true,
      },
    })
      .pipe(
        takeUntil(this.destroyed),
        tap(({ tool }) => {
          this.store$.dispatch(registerTool({ tool: { id: ToolbarComponentEnum.MEASURE, mapToolId: tool.id } }));
        }),
        switchMap(({ tool }) => tool.drawing$),
      )
      .subscribe(drawEvent => {
        if (!drawEvent || drawEvent.type === 'start') {
          this.hideGeometry();
          return;
        }
        if (drawEvent.type === 'end') {
          this.featureGeom.next(drawEvent.geometry);
        }
      });
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
    this.store$.dispatch(deregisterTool({ tool: ToolbarComponentEnum.MEASURE }));
  }

  public measure(type: 'length' | 'area') {
    if (this.toolActive === type) {
      this.hideGeometry();
      this.store$.dispatch(deactivateTool({ tool: ToolbarComponentEnum.MEASURE }));
      return;
    }
    const enableArguments = { type: type === 'area' ? 'area' : 'line' };
    this.store$.dispatch(activateTool({ tool: ToolbarComponentEnum.MEASURE, enableArguments }));
    this.toolActive = type;
    this.hideGeometry();
  }

  private hideGeometry() {
    this.featureGeom.next('');
  }

}
