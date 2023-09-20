import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  DrawingToolConfigModel,
  DrawingToolModel,
  MapService, MapStyleModel,
  ToolTypeEnum,
} from '@tailormap-viewer/map';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BehaviorSubject, switchMap, take, tap } from 'rxjs';
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

  private _geometryType: string | null = null;

  private toolId: string | null = null;

  @Input()
  public set geometryType(geometryType: string | null) {
    this._geometryType = geometryType;
    this.setGeometryType(geometryType);
  }
  public get geometryType() {
    return this._geometryType;
  }

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
          this.toolId = tool.id;
          manager.enableTool(tool.id, true, { type: this.geometryType });
        }),
        switchMap(({ tool }) => tool.drawing$),
      )
      .subscribe(drawEvent => {
        if (drawEvent && drawEvent.type === 'end') {
          this.geometryCreated.emit({ geometry: drawEvent.geometry });
          this.createdGeometrySubject.next(drawEvent.geometry);
        }
        if (drawEvent && drawEvent.type === 'start') {
          this.createdGeometrySubject.next('');
        }
      });
  }

  public setGeometryType(geometryType: string | null) {
    this.mapService.getToolManager$().pipe(take(1)).subscribe((manager) => {
      if (this.toolId) {
        manager.disableTool(this.toolId);
        manager.enableTool(this.toolId, true, { type: geometryType });
        this.createdGeometrySubject.next('');
      }
    });
  }
}
