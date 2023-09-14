import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, OnInit, Output } from '@angular/core';
import {
  DrawingToolConfigModel,
  DrawingToolModel,
  MapService, MapStyleModel,
  ToolTypeEnum,
} from '@tailormap-viewer/map';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BehaviorSubject, switchMap, tap } from 'rxjs';
import { ApplicationStyleService } from '../../../services/application-style.service';

@Component({
  selector: 'tm-create-geometry-tool',
  templateUrl: './create-geometry-tool.component.html',
  styleUrls: ['./create-geometry-tool.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateGeometryToolComponent implements OnInit {

  @Output()
  public geometryCreated = new EventEmitter<{ geometry: string }>();
  private createdGeometrySubject = new BehaviorSubject<string>('');


  constructor(
    private mapService: MapService,
    private destroyRef: DestroyRef,
  ) { }

  public ngOnInit(): void {
    const style: MapStyleModel = {
      styleKey: 'key',
      zIndex: 0,
      pointType: 'circle',
      strokeColor: ApplicationStyleService.getPrimaryColor(),
      pointFillColor: 'transparent',
      pointStrokeColor: ApplicationStyleService.getPrimaryColor(),
    };
    this.mapService.renderFeatures$("create-feature-geometry", this.createdGeometrySubject.asObservable(), style)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
    this.mapService.createTool$<DrawingToolModel, DrawingToolConfigModel>({
      type: ToolTypeEnum.Draw,
      style,
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(({ tool, manager }) => {
          manager.enableTool(tool?.id, true, { type: 'area' });
        }),
        switchMap(({ tool }) => tool.drawing$),
      )
      .subscribe(drawEvent => {
        if (drawEvent && drawEvent.type === 'end') {
          this.geometryCreated.emit({ geometry: drawEvent.geometry });
          this.createdGeometrySubject.next(drawEvent.geometry);
        }
      });
  }
}
