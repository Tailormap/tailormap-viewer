import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { filter, Subject, takeUntil } from 'rxjs';
import { MapService, ScaleBarToolConfigModel, ScaleBarToolModel, ToolTypeEnum } from '@tailormap-viewer/map';

@Component({
  selector: 'tm-scale-bar',
  templateUrl: './scale-bar.component.html',
  styleUrls: ['./scale-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScaleBarComponent implements OnInit, OnDestroy {

  @ViewChild('scaleLine', { static: true, read: ElementRef })
  public scaleLine: ElementRef | undefined;

  private destroyed = new Subject();

  constructor(
    private mapService: MapService,
  ) { }

  public ngOnInit(): void {
    this.mapService.createTool$<ScaleBarToolModel, ScaleBarToolConfigModel>({
      type: ToolTypeEnum.ScaleBar,
      alwaysEnabled: true,
    })
      .pipe(
        takeUntil(this.destroyed),
        filter(Boolean),
      )
      .subscribe(tool => {
        if (this.scaleLine) {
          tool.setTarget(this.scaleLine.nativeElement);
        }
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }


}
