import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, OnDestroy } from '@angular/core';
import { MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { concatMap, of, tap } from 'rxjs';
import { activateTool, deactivateTool, deregisterTool, registerTool } from '../../toolbar/state/toolbar.actions';
import { ToolbarComponentEnum } from '../../toolbar/models/toolbar-component.enum';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { selectEditActiveWithSelectedLayer } from '../state/edit.selectors';
import { loadEditFeatures } from '../state/edit.actions';

@Component({
  selector: 'tm-edit-tool',
  templateUrl: './edit-tool.component.html',
  styleUrls: ['./edit-tool.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditToolComponent implements OnInit, OnDestroy {

  constructor(
    private mapService: MapService,
    private store$: Store,
    private destroyRef: DestroyRef,
  ) { }

  public ngOnInit(): void {
    this.mapService.createTool$<MapClickToolModel, MapClickToolConfigModel>({ type: ToolTypeEnum.MapClick })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(({ tool }) => {
          this.store$.dispatch(registerTool({ tool: { id: ToolbarComponentEnum.EDIT, mapToolId: tool.id } }));
        }),
        concatMap(({ tool }) => tool?.mapClick$ || of(null)),
      )
      .subscribe(mapClick => {
        this.handleMapClick(mapClick);
      });

    this.store$.select(selectEditActiveWithSelectedLayer)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(editActive => {
        if (editActive) {
          this.store$.dispatch(activateTool({ tool: ToolbarComponentEnum.EDIT }));
        } else {
          this.store$.dispatch(deactivateTool({ tool: ToolbarComponentEnum.EDIT }));
        }
      });
  }

  public ngOnDestroy() {
    this.store$.dispatch(deregisterTool({ tool: ToolbarComponentEnum.EDIT }));
  }

  private handleMapClick(evt: { mapCoordinates: [number, number]; mouseCoordinates: [number, number] }) {
    this.store$.dispatch(loadEditFeatures({ coordinates: evt.mapCoordinates }));
  }

}
