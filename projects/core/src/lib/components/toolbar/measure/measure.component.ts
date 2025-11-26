import { ChangeDetectionStrategy, Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { DrawingToolConfigModel, DrawingToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { map, Observable, Subject, switchMap, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { ApplicationStyleService } from '../../../services';
import { selectComponentsConfigForType } from '../../../state';
import { BaseComponentTypeEnum, MeasureComponentConfigModel } from '@tailormap-viewer/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-measure',
  templateUrl: './measure.component.html',
  styleUrls: ['./measure.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MeasureComponent implements OnInit {
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private destroyRef = inject(DestroyRef);

  public toolActive = signal<'length' | 'area' | null>(null);
  private featureGeom = new Subject<string>();

  private defaultLengthTooltip = $localize `:@@core.toolbar.measure-length:Measure distance`;
  private defaultAreaTooltip = $localize `:@@core.toolbar.measure-area:Measure area`;
  public tooltips$: Observable<{ length: string; area: string }>;
  private tool: string | undefined;

  constructor() {
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
    this.mapService.someToolsEnabled$([BaseComponentTypeEnum.MEASURE])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(enabled => {
        if (enabled) {
          return;
        }
        this.hideGeometry();
        this.toolActive.set(null);
      });

    this.mapService.renderFeatures$('measurement-layer', this.featureGeom.asObservable(), {
      styleKey: 'measurement-style',
      zIndex: 9999,
      strokeColor: ApplicationStyleService.getPrimaryColor(),
      strokeWidth: 3,
      showTotalSize: true,
    }, { updateWhileAnimating: true }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    this.mapService.createTool$<DrawingToolModel, DrawingToolConfigModel>({
      type: ToolTypeEnum.Draw,
      owner: BaseComponentTypeEnum.MEASURE,
      style: {
        strokeColor: ApplicationStyleService.getPrimaryColor(),
        pointFillColor: 'transparent',
        pointStrokeColor: ApplicationStyleService.getPrimaryColor(),
        showTotalSize: true,
      },
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(({ tool }) => {
          this.tool = tool.id;
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

  public measure(type: 'length' | 'area') {
    if (this.toolActive() === type) {
      this.hideGeometry();
      this.mapService.disableTool(this.tool);
      return;
    }
    this.mapService.enableTool(this.tool, true, { type: type === 'area' ? 'area' : 'line' });
    this.toolActive.set(type);
    this.hideGeometry();
  }

  private hideGeometry() {
    this.featureGeom.next('');
  }

}
