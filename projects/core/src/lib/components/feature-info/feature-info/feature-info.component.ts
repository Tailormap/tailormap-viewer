import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { loadFeatureInfo } from '../state/feature-info.actions';

@Component({
  selector: 'tm-feature-info',
  templateUrl: './feature-info.component.html',
  styleUrls: ['./feature-info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureInfoComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  private toolConfig: MapClickToolModel = {
    type: ToolTypeEnum.MapClick,
    onClick: evt => this.handleMapClick(evt),
  };

  constructor(
    private mapService: MapService,
    private store$: Store,
  ) { }

  public ngOnInit(): void {
    this.mapService.createTool$(this.toolConfig, true)
      .pipe(takeUntil(this.destroyed))
      .subscribe();
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private handleMapClick(evt: { mapCoordinates: [number, number]; mouseCoordinates: [number, number] }) {
    this.store$.dispatch(loadFeatureInfo({ mapCoordinates: evt.mapCoordinates, mouseCoordinates: evt.mouseCoordinates }));
  }

}
