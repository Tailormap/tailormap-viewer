import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { MapService, ScaleBarToolConfigModel, ScaleBarToolModel, ToolTypeEnum } from '@tailormap-viewer/map';
import { selectIn3DView } from '../../../map/state/map.selectors';
import { Store } from '@ngrx/store';

@Component({
  selector: 'tm-scale-bar',
  templateUrl: './scale-bar.component.html',
  styleUrls: ['./scale-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScaleBarComponent implements OnInit, OnDestroy {

  public scaleType: 'bar' | 'line' = 'bar';
  public in3DView$: Observable<boolean>;

  @ViewChild('scaleTarget', { static: true, read: ElementRef })
  public scaleTarget: ElementRef | undefined;

  private destroyed = new Subject();

  constructor(
    private mapService: MapService,
    private store$: Store,
  ) {
    this.in3DView$ = this.store$.select(selectIn3DView);
  }

  public ngOnInit(): void {
    this.mapService.createTool$<ScaleBarToolModel, ScaleBarToolConfigModel>({
      type: ToolTypeEnum.ScaleBar,
      scaleType: this.scaleType,
      alwaysEnabled: true,
    })
      .pipe(takeUntil(this.destroyed))
      .subscribe(({ tool }) => {
        if (this.scaleTarget) {
          tool.setTarget(this.scaleTarget.nativeElement);
        }
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }


}
